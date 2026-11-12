import { useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { playDeliveryAlert } from "@/utils/deliveryAlert";
import { G1_ACOES, acao } from "@/lib/g1/acoes";
import { dataOperacional } from "@/lib/dataOperacional";

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
  entrega_prevista?: string | null;
  delivery_person_id?: string | null;
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
      // Mesma entrega (mesmo ID) de Pedidos e da portaria, ligada à conta do entregador.
      // Abertas de qualquer data (não somem na virada do dia) + concluídas hoje (horário da Bahia).
      const hoje = dataOperacional();
      const [abertas, feitas] = await Promise.all([
        supabase.from("orders").select("*").eq("delivery_person_id", user.id)
          .not("status", "in", "(completed,delivered,cancelled)").order("created_at", { ascending: true }),
        supabase.from("orders").select("*").eq("delivery_person_id", user.id).in("status", ["completed", "delivered"])
          .gte("delivered_at", `${hoje}T00:00:00-03:00`).order("delivered_at", { ascending: false }),
      ]);
      if (abertas.error) throw abertas.error;
      if (feitas.error) throw feitas.error;
      return [...(abertas.data ?? []), ...(feitas.data ?? [])] as DeliveryOrder[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`deliveries-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `delivery_person_id=eq.${user.id}` },
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
      if (G1_ACOES) {
        await acao("entregador_aceitar_entrega", { _order_id: orderId });
        return;
      }
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
    onError: (e: Error) => toast({ title: "Não foi possível", description: e.message, variant: "destructive" }),
  });
}

export function useRejectDelivery() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      if (G1_ACOES) {
        await acao("entregador_recusar_entrega", { _order_id: orderId, _motivo: reason });
        return;
      }
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
    onError: (e: Error) => toast({ title: "Não foi possível", description: e.message, variant: "destructive" }),
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ orderId, recebeuVasilhame, vasilhamesRecebidos = 0 }: { orderId: string; recebeuVasilhame: boolean; vasilhamesRecebidos?: number }) => {
      if (G1_ACOES) {
        // Forma combinada no pedido; a conclusão consome a carga e registra o
        // recebimento (ou a promissória) uma vez só. Chave fixa por pedido:
        // tocar de novo ou reenviar não conclui duas vezes.
        const { data: o, error: e1 } = await supabase.from("orders").select("payment_method").eq("id", orderId).maybeSingle();
        if (e1) throw e1;
        await acao("entregador_concluir_entrega", {
          _order_id: orderId,
          _forma: o?.payment_method ?? null,
          _vasilhames_recebidos: recebeuVasilhame ? vasilhamesRecebidos : 0,
          _chave: `concluir-entrega:${orderId}`,
        });
        return;
      }
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
    onError: (e: Error) => toast({ title: "Entrega não concluída", description: e.message, variant: "destructive" }),
  });
}
