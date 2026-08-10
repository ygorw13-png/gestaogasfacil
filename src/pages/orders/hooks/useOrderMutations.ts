import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { createPromissoryFromSale, isPromissoryPayment } from "@/lib/promissory";

export function useOrderMutations(orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>>) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAddOrder = useCallback(async (order: Order) => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = order.userId || authData?.user?.id;
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const newOrderData = {
        user_id: userId,
        client_name: order.clientName,
        client_phone: order.clientPhone,
        address: order.address,
        product: order.product,
        quantity: order.quantity,
        price: order.price || 0,
        payment_method: order.paymentMethod || null,
        has_empty_cylinder: order.hasEmptyCylinder || false,
        is_complete_package: order.isCompletePackage || false,
        status: "pending" as OrderStatus,
        tipo_venda: order.tipoVenda ?? "completa",
        vasilhames_entregues: order.tipoVenda === "recarga" ? 0 : (order.quantity || 0),
        vasilhames_recebidos: 0,
        notes: order.notes
      };

      
      const { data, error } = await supabase
        .from('orders')
        .insert(newOrderData)
        .select()
        .single();

      if (error) throw error;

      // Formatar o endereço corretamente para o objeto Order
      let address = {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
      };

      if (typeof data.address === 'object' && data.address) {
        const addr = data.address as Record<string, any>;
        address = {
          street: String(addr.street || ''),
          number: String(addr.number || ''),
          complement: addr.complement ? String(addr.complement) : '',
          neighborhood: addr.neighborhood ? String(addr.neighborhood) : '',
        };
      }

      const newOrder: Order = {
        id: data.id,
        clientName: data.client_name,
        clientPhone: data.client_phone || '',
        address,
        product: data.product || '',
        quantity: Number(data.quantity) || 0,
        price: Number(data.price) || 0,
        hasEmptyCylinder: Boolean(data.has_empty_cylinder),
        isCompletePackage: Boolean(data.is_complete_package),
        createdAt: new Date(data.created_at),
        status: data.status as OrderStatus,
        notes: data.notes
      };
      
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      toast({
        title: "Pedido registrado",
        description: `Pedido para ${order.clientName} registrado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao adicionar pedido:", error);
      toast({
        title: "Erro ao adicionar pedido",
        description: error instanceof Error ? error.message : "Não foi possível registrar o pedido.",
        variant: "destructive",
      });

    } finally {
      setLoading(false);
    }
  }, [toast, setOrders]);

  const handleAssignOrder = useCallback(async (orderId: string, deliveryPerson: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_person: deliveryPerson,
          status: "assigned",
          assigned_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Notificação push para o entregador (não bloqueia o fluxo)
      supabase.functions
        .invoke("send-push", {
          body: {
            deliveryPersonName: deliveryPerson,
            title: "Nova entrega atribuída",
            body: "Você recebeu uma nova entrega. Abra o app para aceitar.",
            url: "/entregador/entregas",
          },
        })
        .catch((e) => console.warn("Falha ao enviar push:", e));



      setOrders(prevOrders => 
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "assigned",
              deliveryPerson,
              assignedAt: new Date(),
            };
          }
          return order;
        })
      );

      toast({
        title: "Pedido atribuído",
        description: `Pedido atribuído a ${deliveryPerson}`,
      });
    } catch (error) {
      console.error("Erro ao atribuir pedido:", error);
      toast({
        title: "Erro ao atribuir pedido",
        description: "Não foi possível atribuir o pedido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, setOrders]);

  const handleStatusChange = useCallback(async (
    orderId: string, 
    status: OrderStatus, 
    extraData?: {
      paymentMethod?: string;
      receivedValue?: number;
      divergenceReason?: string;
    }
  ) => {
    setLoading(true);
    try {
      const updateData: Record<string, any> = { status };
      
      if (status === "delivering") {
        // Sem dados adicionais para entregar
      } else if (status === "delivered" && extraData?.paymentMethod) {
        updateData.delivered_at = new Date().toISOString();
        updateData.payment_method = extraData.paymentMethod;
        if (typeof extraData.receivedValue === "number") {
          updateData.price = extraData.receivedValue;
        }
        if (extraData.divergenceReason) {
          const current = orders.find((o) => o.id === orderId);
          const previous = current?.notes ? `${current.notes}\n` : "";
          updateData.notes = `${previous}[Divergência na entrega] ${extraData.divergenceReason}`;
        }
      }

      const { error } = await (supabase
        .from('orders') as any)
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Entrega paga em promissória: gera a obrigação com vencimento em 30 dias
      if (status === "delivered" && isPromissoryPayment(extraData?.paymentMethod)) {
        const current = orders.find((o) => o.id === orderId);
        const { error: pnError } = await createPromissoryFromSale({
          clientId: (current as any)?.clientId || null,
          clientName: current?.clientName || "Cliente",
          value:
            typeof extraData?.receivedValue === "number"
              ? extraData.receivedValue
              : Number(current?.price) || 0,
          referenceId: orderId,
          description: `Entrega - ${current?.quantity ?? ""}x ${current?.product ?? ""}`.trim(),
        });
        if (pnError) {
          toast({ title: "Promissória não criada", description: pnError, variant: "destructive" });
        } else {
          toast({ title: "Nota promissória gerada", description: "Vencimento em 30 dias." });
        }
      }


      setOrders(prevOrders => 
        prevOrders.map((order) => {
          if (order.id === orderId) {
            const updatedOrder = {
              ...order,
              status,
            };
            
            if (status === "delivered" && extraData?.paymentMethod) {
              updatedOrder.deliveredAt = new Date();
              updatedOrder.paymentMethod = extraData.paymentMethod;
              if (typeof extraData.receivedValue === "number") {
                updatedOrder.price = extraData.receivedValue;
              }
              if (extraData.divergenceReason) {
                updatedOrder.notes = `${order.notes ? order.notes + "\n" : ""}[Divergência na entrega] ${extraData.divergenceReason}`;
              }
            }
            
            return updatedOrder;
          }
          return order;
        })
      );

      const messages = {
        delivering: {
          title: "Entrega iniciada",
          description: "Entrega em andamento"
        },
        delivered: {
          title: "Entrega concluída",
          description: "Pedido entregue com sucesso"
        },
        cancelled: {
          title: "Pedido cancelado",
          description: "Pedido cancelado com sucesso"
        }
      };

      const messageConfig = messages[status as keyof typeof messages] || {
        title: "Status atualizado",
        description: `Status alterado para ${status}`
      };

      toast({
        title: messageConfig.title,
        description: messageConfig.description,
        variant: status === "cancelled" ? "destructive" : "default",
      });
    } catch (error) {
      console.error(`Erro ao atualizar status para ${status}:`, error);
      toast({
        title: `Erro ao atualizar status`,
        description: `Não foi possível atualizar o pedido para ${status}.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, setOrders, orders]);

  const handleStartDelivery = useCallback(async (orderId: string) => {
    return handleStatusChange(orderId, "delivering");
  }, [handleStatusChange]);

  const handleCompleteOrder = useCallback(async (
    orderId: string,
    payload: { paymentMethod: string; receivedValue?: number; divergenceReason?: string }
  ) => {
    return handleStatusChange(orderId, "delivered", payload);
  }, [handleStatusChange]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    return handleStatusChange(orderId, "cancelled");
  }, [handleStatusChange]);

  return {
    loading,
    handleAddOrder,
    handleAssignOrder,
    handleStartDelivery,
    handleCompleteOrder,
    handleCancelOrder,
  };
}
