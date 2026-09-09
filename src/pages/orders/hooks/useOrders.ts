import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderMutations } from "./useOrderMutations";

const toLocalISODate = (d: Date) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export function useOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const today = toLocalISODate(new Date());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const orderMutations = useOrderMutations(orders, setOrders);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, dateFrom, dateTo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const inicio = new Date(`${dateFrom}T00:00:00`);
      const fim = new Date(`${dateTo}T23:59:59.999`);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        // Vendas avulsas (balcão da portaria / venda na rua) não entram na gestão de pedidos
        .or('origem_venda.is.null,origem_venda.not.in.(portaria,venda_rua,balcao),delivery_person.not.is.null')
        // Somente pedidos dentro do período selecionado (padrão: hoje)
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString())
        .order('created_at', { ascending: false });




      if (error) throw error;

      const deliveryPersonIds = Array.from(
        new Set(data.map((order) => order.delivery_person).filter((id): id is string => Boolean(id)))
      );
      const deliveryNames = new Map<string, string>();

      if (deliveryPersonIds.length > 0) {
        const [{ data: collaborators }, { data: userProfiles }] = await Promise.all([
          supabase.from("colaboradores").select("id, nome").in("id", deliveryPersonIds),
          supabase.from("profiles").select("id, name").in("id", deliveryPersonIds),
        ]);

        collaborators?.forEach((collaborator) => {
          deliveryNames.set(collaborator.id, collaborator.nome);
        });
        userProfiles?.forEach((p) => {
          deliveryNames.set(p.id, p.name);
        });
      }

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
          deliveryPersonName: order.delivery_person
            ? deliveryNames.get(order.delivery_person) || "Entregador"
            : undefined,
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
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    isToday: dateFrom === today && dateTo === today,
    resetToToday: () => {
      setDateFrom(today);
      setDateTo(today);
    },

    ...orderMutations
  };
}
