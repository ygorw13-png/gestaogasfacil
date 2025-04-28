
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data.map(order => ({
        id: order.id,
        clientName: order.client_name,
        clientPhone: order.client_phone,
        address: order.address ? order.address : {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
        },
        product: order.product || '',
        quantity: order.quantity || 0,
        price: order.price || 0,
        hasEmptyCylinder: order.has_empty_cylinder || false,
        isCompletePackage: order.is_complete_package || false,
        createdAt: new Date(order.created_at),
        status: order.status as OrderStatus,
        deliveryPerson: order.delivery_person,
        assignedAt: order.assigned_at ? new Date(order.assigned_at) : undefined,
        deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
        paymentMethod: order.payment_method,
        notes: order.notes
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro ao buscar pedidos",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (order: Order) => {
    try {
      const newOrderData = {
        user_id: user?.id,
        client_name: order.clientName,
        client_phone: order.clientPhone,
        address: order.address,
        product: order.product,
        quantity: order.quantity,
        price: order.price || 0,
        has_empty_cylinder: order.hasEmptyCylinder || false,
        is_complete_package: order.isCompletePackage || false,
        status: "pending" as OrderStatus,
        notes: order.notes
      };
      
      const { data, error } = await supabase
        .from('orders')
        .insert(newOrderData)
        .select()
        .single();

      if (error) throw error;

      const newOrder: Order = {
        id: data.id,
        clientName: data.client_name,
        clientPhone: data.client_phone,
        address: data.address,
        product: data.product,
        quantity: data.quantity,
        price: data.price,
        hasEmptyCylinder: data.has_empty_cylinder,
        isCompletePackage: data.is_complete_package,
        createdAt: new Date(data.created_at),
        status: data.status as OrderStatus,
        notes: data.notes
      };
      
      setOrders([newOrder, ...orders]);
      toast({
        title: "Pedido registrado",
        description: `Pedido para ${order.clientName} registrado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao adicionar pedido:", error);
      toast({
        title: "Erro ao adicionar pedido",
        description: "Não foi possível registrar o pedido.",
        variant: "destructive",
      });
    }
  };

  const handleAssignOrder = async (orderId: string, deliveryPerson: string) => {
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

      setOrders(
        orders.map((order) => {
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
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: "delivering" 
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(
        orders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "delivering",
            };
          }
          return order;
        })
      );

      toast({
        title: "Entrega iniciada",
        description: "Entrega em andamento",
      });
    } catch (error) {
      console.error("Erro ao iniciar entrega:", error);
      toast({
        title: "Erro ao iniciar entrega",
        description: "Não foi possível iniciar a entrega.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOrder = async (orderId: string, paymentMethod: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: "delivered",
          delivered_at: new Date().toISOString(),
          payment_method: paymentMethod
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(
        orders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "delivered",
              deliveredAt: new Date(),
              paymentMethod,
            };
          }
          return order;
        })
      );

      toast({
        title: "Entrega concluída",
        description: "Pedido entregue com sucesso",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao concluir pedido:", error);
      toast({
        title: "Erro ao concluir pedido",
        description: "Não foi possível concluir o pedido.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: "cancelled"
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(
        orders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "cancelled",
            };
          }
          return order;
        })
      );

      toast({
        title: "Pedido cancelado",
        description: "Pedido cancelado com sucesso",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      toast({
        title: "Erro ao cancelar pedido",
        description: "Não foi possível cancelar o pedido.",
        variant: "destructive",
      });
    }
  };

  return {
    orders,
    loading,
    handleAddOrder,
    handleAssignOrder,
    handleStartDelivery,
    handleCompleteOrder,
    handleCancelOrder,
  };
}
