import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { G1_ACOES } from "@/lib/g1/acoes";
import type { ReembolsoLinha, ReversaoLinha } from "@/lib/g1/reversao";

export interface ReversaoComPedido extends ReversaoLinha {
  pedido: { client_name: string; delivery_person: string | null; delivery_person_id: string | null; payment_method: string | null } | null;
}
export interface ItemConferencia {
  id: string; reversao_id: string; local: string; carga_id: string | null; produto: string;
  cheios: number; vazios: number; condicao: string; status: string; motivo_resolucao: string | null; criado_em: string;
}

const SEL = "*, pedido:orders!reversoes_order_id_fkey(client_name, delivery_person, delivery_person_id, payment_method)";

/** Reversões visíveis para a conta (o banco filtra: operador vê a empresa; entregador vê as suas). */
export function useReversoes(dias = 60) {
  return useQuery({
    queryKey: ["reversoes", "lista", dias],
    enabled: G1_ACOES,
    queryFn: async () => {
      const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
      const { data, error } = await supabase.from("reversoes").select(SEL)
        .or(`solicitado_em.gte.${desde},status.in.(solicitada,aguardando_retorno,reembolso_pendente)`)
        .order("solicitado_em", { ascending: false }).limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as ReversaoComPedido[];
    },
  });
}

export function useReembolsos(dias = 60) {
  return useQuery({
    queryKey: ["reversoes", "reembolsos", dias],
    enabled: G1_ACOES,
    queryFn: async () => {
      const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
      const { data, error } = await supabase.from("reembolsos").select("*")
        .or(`criado_em.gte.${desde},status.eq.pendente`).order("criado_em", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as ReembolsoLinha[];
    },
  });
}

export function useItensConferencia() {
  return useQuery({
    queryKey: ["reversoes", "conferencia"],
    enabled: G1_ACOES,
    queryFn: async () => {
      const { data, error } = await supabase.from("itens_conferencia").select("*").order("criado_em", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as ItemConferencia[];
    },
  });
}

/** Andamento da reversão de cada pedido da lista (para mostrar na venda original). */
export function useReversoesDosPedidos(ids: string[]) {
  const chave = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["reversoes", "pedidos", chave],
    enabled: G1_ACOES && ids.length > 0,
    queryFn: async () => {
      const mapa = new Map<string, ReversaoLinha>();
      for (let i = 0; i < ids.length; i += 150) {
        const { data, error } = await supabase.from("reversoes").select("*").in("order_id", ids.slice(i, i + 150))
          .order("solicitado_em", { ascending: true });
        if (error) throw error;
        for (const r of (data ?? []) as unknown as ReversaoLinha[]) {
          if (r.status !== "recusada" || !mapa.has(r.order_id)) mapa.set(r.order_id, r);
        }
      }
      return mapa;
    },
  });
}

/** Depois de qualquer ação de reversão: estoque, dinheiro, carga, vendas e promissórias mudam juntos. */
export function useAtualizarAposReversao() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
