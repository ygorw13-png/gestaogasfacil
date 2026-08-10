import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderMutations } from "./useOrderMutations";

export function useOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const orderMutations = useOrderMutations(orders, setOrders);

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
        // Vendas avulsas (balcão da portaria / venda na rua) não entram na gestão de pedidos
        .or('origem_venda.is.null,origem_venda.not.in.(portaria,venda_rua,balcao),delivery_person.not.is.null')
        .order('created_at', { ascending: false });


      if (error) throw error;

      const formattedOrders: Order[] = data.map(order => {
        // Certifique-se de que o formato do endereço seja compatível
        let address = {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
        };

        if (typeof order.address === 'object' && order.address) {
          const addr = order.address as Record<string, any>;
          address = {
            street: String(addr.street || ''),
            number: String(addr.number || ''),
            complement: addr.complement ? String(addr.complement) : '',
            neighborhood: addr.neighborhood ? String(addr.neighborhood) : '',
          };
        }

        return {
          id: order.id,
          clientName: order.client_name,
          clientPhone: order.client_phone || '',
          address,
          product: order.product || '',
          quantity: Number(order.quantity) || 0,
          price: Number(order.price) || 0,
          hasEmptyCylinder: Boolean(order.has_empty_cylinder),
          isCompletePackage: Boolean(order.is_complete_package),
          createdAt: new Date(order.created_at),
          status: order.status as OrderStatus,
          deliveryPerson: order.delivery_person,
          assignedAt: order.assigned_at ? new Date(order.assigned_at) : undefined,
          deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
          paymentMethod: order.payment_method,
          notes: order.notes,
          userId: user?.id
        };
      });

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

  return {
    orders,
    loading: loading || orderMutations.loading,
    fetchOrders,
    ...orderMutations
  };
}
