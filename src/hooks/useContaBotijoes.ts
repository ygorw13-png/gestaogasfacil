import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ParceiroTipo = "agregado" | "ponto";

export interface LancamentoConta {
  id: string;
  parceiro_tipo: ParceiroTipo;
  parceiro_id: string;
  parceiro_nome: string;
  tipo: "entrega" | "pagamento" | "ajuste";
  produto: string;
  quantidade: number;
  vasilhames_recebidos: number;
  preco_unitario: number | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  data: string;
  rota_id: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface SaldoParceiro {
  parceiro_id: string;
  parceiro_nome: string;
  botijoes_devidos: number;
  valor_recebido: number;
  ultima_entrega: string | null;
  entregas_30d: number;
}

/** Lançamentos de um parceiro (agregado ou ponto de revenda) */
export function useLancamentosConta(tipo?: ParceiroTipo, parceiroId?: string) {
  return useQuery({
    queryKey: ["conta-botijoes", tipo ?? "all", parceiroId ?? "all"],
    queryFn: async (): Promise<LancamentoConta[]> => {
      let q = supabase
        .from("conta_botijoes" as any)
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (tipo) q = q.eq("parceiro_tipo", tipo);
      if (parceiroId) q = q.eq("parceiro_id", parceiroId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as LancamentoConta[];
    },
  });
}

/** Saldo consolidado (em botijões) por parceiro */
export function useSaldosConta(tipo: ParceiroTipo) {
  const { data: lancamentos, isLoading } = useLancamentosConta(tipo);

  const mapa = new Map<string, SaldoParceiro>();
  const limite30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  (lancamentos ?? []).forEach((l) => {
    const atual =
      mapa.get(l.parceiro_id) ??
      ({
        parceiro_id: l.parceiro_id,
        parceiro_nome: l.parceiro_nome,
        botijoes_devidos: 0,
        valor_recebido: 0,
        ultima_entrega: null,
        entregas_30d: 0,
      } as SaldoParceiro);

    if (l.tipo === "entrega") {
      atual.botijoes_devidos += l.quantidade;
      if (!atual.ultima_entrega || l.data > atual.ultima_entrega) atual.ultima_entrega = l.data;
      if (l.data >= limite30) atual.entregas_30d += l.quantidade;
    } else if (l.tipo === "pagamento") {
      atual.botijoes_devidos -= l.quantidade;
      atual.valor_recebido += Number(l.valor_total ?? 0);
    } else {
      atual.botijoes_devidos += l.quantidade;
    }
    mapa.set(l.parceiro_id, atual);
  });

  return { saldos: Array.from(mapa.values()), isLoading };
}

export interface EntregaContaInput {
  parceiro_tipo: ParceiroTipo;
  parceiro_id: string;
  parceiro_nome: string;
  produto?: string;
  quantidade: number;
  vasilhames_recebidos?: number;
  data?: string;
  rota_id?: string | null;
  order_id?: string | null;
  observacoes?: string | null;
}

export function useRegistrarEntregaConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EntregaContaInput) => {
      const { error } = await supabase.from("conta_botijoes" as any).insert({
        parceiro_tipo: input.parceiro_tipo,
        parceiro_id: input.parceiro_id,
        parceiro_nome: input.parceiro_nome,
        tipo: "entrega",
        produto: input.produto ?? "P13",
        quantidade: input.quantidade,
        vasilhames_recebidos: input.vasilhames_recebidos ?? 0,
        data: input.data ?? new Date().toISOString().slice(0, 10),
        rota_id: input.rota_id ?? null,
        order_id: input.order_id ?? null,
        observacoes: input.observacoes ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conta-botijoes"] });
    },
    onError: (e: Error) => toast.error(`Erro ao lançar entrega: ${e.message}`),
  });
}

export interface PagamentoContaInput {
  parceiro_tipo: ParceiroTipo;
  parceiro_id: string;
  parceiro_nome: string;
  quantidade: number;
  preco_unitario: number;
  forma_pagamento: string;
  data?: string;
  observacoes?: string | null;
}

export function useRegistrarPagamentoConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PagamentoContaInput) => {
      const { error } = await supabase.from("conta_botijoes" as any).insert({
        parceiro_tipo: input.parceiro_tipo,
        parceiro_id: input.parceiro_id,
        parceiro_nome: input.parceiro_nome,
        tipo: "pagamento",
        quantidade: input.quantidade,
        preco_unitario: input.preco_unitario,
        valor_total: input.quantidade * input.preco_unitario,
        forma_pagamento: input.forma_pagamento,
        data: input.data ?? new Date().toISOString().slice(0, 10),
        observacoes: input.observacoes ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento registrado");
      qc.invalidateQueries({ queryKey: ["conta-botijoes"] });
    },
    onError: (e: Error) => toast.error(`Erro ao registrar pagamento: ${e.message}`),
  });
}
