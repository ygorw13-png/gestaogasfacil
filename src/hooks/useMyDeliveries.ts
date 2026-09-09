import { useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { playDeliveryAlert } from "@/utils/deliveryAlert";

export interface DeliveryOrder {
  id: string;
  client_name: string;
  client_phone: string | null;
  address: any;
  product: string | null;
  quantity: number | null;
  price: number | null;
  payment_method: string | null;
  notes: string | null;
  status: string;
  accepted_at: string | null;
  delivered_at: string | null;
  delivery_person: string | null;
  created_at: string;
  tipo_venda?: string | null;
  vasilhames_entregues?: number | null;
  vasilhames_recebidos?: number | null;
}

/**
 * Lista entregas atribuídas ao entregador logado + escuta realtime
 * com alerta sonoro quando chegar pedido novo.
 */
export function useMyDeliveries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const initialLoad = useRef(true);

  const query = useQuery({
    queryKey: ["my-deliveries", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("delivery_person", user.id)
        .gte("created_at", inicioHoje.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DeliveryOrder[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`deliveries-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `delivery_person=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["my-deliveries", user.id] });
          // Toca alerta só em mudanças após o load inicial
          if (!initialLoad.current && (payload.eventType === "INSERT" || payload.eventType === "UPDATE")) {
            const newRow = payload.new as any;
            // Alerta se for novo pedido pendente de aceitação
            if (newRow?.status === "pending" || newRow?.status === "assigned") {
              playDeliveryAlert();
              toast({
                title: "🛵 Nova entrega!",
                description: `${newRow.client_name} - ${newRow.product ?? ""}`,
              });
            }
          }
          initialLoad.current = false;
        }
      )
      .subscribe();

    // Marca initial load como concluído após primeira renderização
    const t = setTimeout(() => { initialLoad.current = false; }, 1500);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(t);
    };
  }, [user?.id, qc, toast]);

  return query;
}

export function useAcceptDelivery() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "delivering", accepted_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast({ title: "Entrega aceita!", description: "Boa entrega 🛵" });
    },
  });
}

export function useRejectDelivery() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_person: null, rejection_reason: reason, status: "pending" })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast({ title: "Entrega recusada", description: "Voltou para a fila" });
    },
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ orderId, recebeuVasilhame, vasilhamesRecebidos = 0 }: { orderId: string; recebeuVasilhame: boolean; vasilhamesRecebidos?: number }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "completed",
          delivered_at: new Date().toISOString(),
          has_empty_cylinder: recebeuVasilhame,
          vasilhames_recebidos: recebeuVasilhame ? vasilhamesRecebidos : 0,
        } as any)
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast({ title: "Entrega confirmada!", description: "Já consta no painel da portaria." });
    },
  });
}
