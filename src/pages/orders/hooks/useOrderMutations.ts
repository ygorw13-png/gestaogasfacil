import { useState, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { createPromissoryFromSale, isPromissoryPayment } from "@/lib/promissory";
import { G1_ACOES, acao, novaChave } from "@/lib/g1/acoes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AssignOptions {
  /** Produto sai agora da portaria para a carga do entregador (entrega avulsa). */
  retirarDaPortaria?: boolean;
  /** Obrigatório para trocar o entregador de um pedido já atribuído. */
  motivo?: string;
  /** Chave de reenvio da tela (useOperacaoUnica). Com ela, o erro é devolvido a quem chamou. */
  chave?: string;
  /** Nome do entregador para a confirmação (antes aparecia o ID). */
  nomeEntregador?: string;
  /** Reatribuição: o produto passou fisicamente da carga do entregador anterior para a do novo. */
  transferirCarga?: boolean;
}

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

      const newOrderData: Database["public"]["Tables"]["orders"]["Insert"] = {
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
        origem_venda: "pedido",
        entrega_prevista: order.entregaPrevista || null,
        tipo_venda: order.tipoVenda ?? "completa",
        vasilhames_entregues: order.tipoVenda === "recarga" ? 0 : (order.quantity || 0),
        vasilhames_recebidos: 0,
        notes: order.notes
      };

      
      // Com id vindo da tela (chave da operação), um reenvio após resposta perdida bate na chave primária
      // em vez de criar um segundo pedido. Sem id (chamadas antigas), o banco gera.
      const idCliente = typeof order.id === "string" && UUID_RE.test(order.id) ? order.id : undefined;
      const payload: Database["public"]["Tables"]["orders"]["Insert"] = idCliente ? { id: idCliente, ...newOrderData } : newOrderData;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { data, error }: { data: any; error: any } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();

      if (error && error.code === '23505' && idCliente) {
        // Já gravado numa tentativa anterior: usa o registro existente, desde que seja o MESMO pedido.
        const existente = await supabase.from('orders').select().eq('id', idCliente).single();
        data = existente.data; error = existente.error;
        if (!error && data && (data.client_name !== newOrderData.client_name || data.product !== newOrderData.product
            || Number(data.quantity) !== Number(newOrderData.quantity) || Number(data.price) !== Number(newOrderData.price))) {
          throw new Error("Esta chave de envio já pertence a outro pedido. Registre como novo pedido.");
        }
      }
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
        paymentMethod: data.payment_method || undefined,
        hasEmptyCylinder: Boolean(data.has_empty_cylinder),
        isCompletePackage: Boolean(data.is_complete_package),
        createdAt: new Date(data.created_at),
        status: data.status as OrderStatus,
        notes: data.notes
      };
      
      setOrders(prevOrders => [newOrder, ...prevOrders.filter((o) => o.id !== newOrder.id)]);
      toast({
        title: "Pedido registrado",
        description: `Pedido para ${order.clientName} registrado com sucesso`,
      });
      return newOrder;
    } catch (error) {
      console.error("Erro ao adicionar pedido:", error);
      toast({
        title: "Erro ao adicionar pedido",
        description: error instanceof Error ? error.message : "Não foi possível registrar o pedido.",
        variant: "destructive",
      });
      // Relança para que o chamador não confirme/imprima um pedido não salvo
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, setOrders]);

  const handleAssignOrder = useCallback(async (orderId: string, deliveryPerson: string, opts: AssignOptions = {}): Promise<boolean> => {
    setLoading(true);
    try {
      if (G1_ACOES) {
        const atual = orders.find((o) => o.id === orderId);
        if (atual?.deliveryPersonId && atual.deliveryPersonId !== deliveryPerson) {
          // Troca explícita, por ID, com motivo; o produto só muda de carga com transferência física registrada.
          if (!opts.motivo?.trim()) throw new Error("Informe o motivo da troca de entregador.");
          await acao("reatribuir_entrega", {
            _order_id: orderId, _novo_entregador_id: deliveryPerson, _motivo: opts.motivo.trim(),
            _transferir_carga: !!opts.transferirCarga, _chave: opts.chave ?? novaChave("reatribuir"),
          });
        } else {
          await acao("atribuir_entrega", {
            _order_id: orderId, _entregador_id: deliveryPerson,
            _retirar_da_portaria: !!opts.retirarDaPortaria, _chave: opts.chave ?? novaChave("atribuir"),
          });
        }
      } else {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_person: deliveryPerson,
          status: "assigned",
          assigned_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      }

      // Atribuição confirmada no banco: o servidor avisa quem está no pedido AGORA
      // (na reatribuição, o novo responsável). Não bloqueia o fluxo.
      supabase.functions
        .invoke("send-push", { body: { tipo: "atribuicao", orderId } })
        .catch((e) => console.warn("Falha ao enviar push:", e));



      setOrders(prevOrders => 
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "assigned",
              deliveryPerson,
              deliveryPersonId: deliveryPerson,
              acceptedAt: undefined,
              rejectionReason: null,
              ...(opts.nomeEntregador ? { deliveryPersonName: opts.nomeEntregador } : {}),
              assignedAt: new Date(),
            };
          }
          return order;
        })
      );

      toast({
        title: "Pedido atribuído",
        description: opts.nomeEntregador ? `Pedido atribuído a ${opts.nomeEntregador}` : "Pedido atribuído ao entregador",
      });
      return true;
    } catch (error) {
      console.error("Erro ao atribuir pedido:", error);
      // A tela que mandou a chave mostra o erro e decide a próxima tentativa.
      if (opts.chave) throw error;
      toast({
        title: "Erro ao atribuir pedido",
        description: G1_ACOES && error instanceof Error ? error.message : "Não foi possível atribuir o pedido.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, setOrders, orders]);

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
      if (G1_ACOES && status === "cancelled") {
        // Decisão B: cancelamento de pedido pela reversão controlada. Administrador autoriza;
        // operador só solicita. Produto já na carga continua na carga; pagamento vira reembolso pendente.
        // Papel conferido no banco (a ação também confere): administrador autoriza, operador solicita.
        const { data: isAdmin } = await (supabase as any).rpc("is_admin");
        const motivo = window.prompt(isAdmin
          ? "Motivo do cancelamento (fica no histórico):"
          : "Motivo do pedido de cancelamento (o administrador autoriza):")?.trim();
        // Fechar a caixa de motivo = desistir: nada é enviado e não há aviso de erro.
        if (motivo === undefined || motivo === null) return;
        if (!motivo) throw new Error("Cancelamento exige motivo.");
        await acao("reversao_solicitar", {
          _order_id: orderId, _tipo: "cancelamento", _motivo: motivo, _order_valida_id: null,
          _pagamento_duplicado: null, _autorizar: isAdmin === true, _chave: novaChave("cancelar-pedido"),
        });
        if (!isAdmin) {
          toast({ title: "Cancelamento solicitado", description: "O pedido continua como está até o administrador autorizar em Reversões e Reembolsos." });
          return;
        }
      } else if (G1_ACOES && status === "delivered") {
        // Conclui pela portaria: consome a carga do entregador atribuído, registra
        // recebimento/promissória e divergência. O preço da venda não muda.
        await acao("operador_concluir_entrega", {
          _order_id: orderId, _forma: extraData?.paymentMethod ?? null,
          _valor_recebido: typeof extraData?.receivedValue === "number" ? extraData.receivedValue : null,
          _vasilhames_recebidos: 0, _motivo_divergencia: extraData?.divergenceReason ?? null,
          _chave: `concluir-entrega:${orderId}`,
        });
      } else {
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
              if (!G1_ACOES && typeof extraData.receivedValue === "number") {
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
        description: G1_ACOES && error instanceof Error ? error.message : `Não foi possível atualizar o pedido para ${status}.`,
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
