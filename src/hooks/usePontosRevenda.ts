import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSaldosConta } from "./useContaBotijoes";

export interface PontoRevenda {
  id: string;
  nome: string;
  povoado: string | null;
  telefone: string | null;
  vasilhames_emprestados: number;
  media_botijoes: number;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
}

export interface PontoInput {
  nome: string;
  povoado?: string | null;
  telefone?: string | null;
  vasilhames_emprestados?: number;
  media_botijoes?: number;
  observacoes?: string | null;
}

export function usePontosRevenda() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["pontos-revenda"],
    queryFn: async (): Promise<PontoRevenda[]> => {
      const { data, error } = await supabase
        .from("pontos_revenda" as any)
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as unknown as PontoRevenda[];
    },
  });

  const criarPonto = useMutation({
    mutationFn: async (input: PontoInput) => {
      const { error } = await supabase.from("pontos_revenda" as any).insert({
        nome: input.nome,
        povoado: input.povoado ?? null,
        telefone: input.telefone ?? null,
        vasilhames_emprestados: input.vasilhames_emprestados ?? 0,
        media_botijoes: input.media_botijoes ?? 0,
        observacoes: input.observacoes ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ponto de revenda cadastrado");
      qc.invalidateQueries({ queryKey: ["pontos-revenda"] });
    },
    onError: (e: Error) => toast.error(`Erro ao cadastrar: ${e.message}`),
  });

  const atualizarPonto = useMutation({
    mutationFn: async ({ id, ...input }: PontoInput & { id: string }) => {
      const { error } = await supabase
        .from("pontos_revenda" as any)
        .update({
          nome: input.nome,
          povoado: input.povoado ?? null,
          telefone: input.telefone ?? null,
          vasilhames_emprestados: input.vasilhames_emprestados ?? 0,
          media_botijoes: input.media_botijoes ?? 0,
          observacoes: input.observacoes ?? null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ponto atualizado");
      qc.invalidateQueries({ queryKey: ["pontos-revenda"] });
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });

  const removerPonto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pontos_revenda" as any)
        .update({ ativo: false } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ponto desativado");
      qc.invalidateQueries({ queryKey: ["pontos-revenda"] });
    },
    onError: (e: Error) => toast.error(`Erro ao remover: ${e.message}`),
  });

  return {
    pontos: query.data ?? [],
    isLoading: query.isLoading,
    criarPonto,
    atualizarPonto,
    removerPonto,
  };
}

export interface AlertaPonto {
  ponto: PontoRevenda;
  diasSemEntrega: number | null;
  botijoesDevidos: number;
  consumoDiario: number;
  diasEstimadosRestantes: number | null;
  urgencia: "ok" | "atencao" | "urgente";
}

const diffDias = (iso: string) =>
  Math.floor((Date.now() - new Date(`${iso}T00:00:00`).getTime()) / 86400000);

/** Estima quando cada ponto de revenda deve estar acabando o estoque */
export function useAlertasPontos() {
  const { pontos, isLoading } = usePontosRevenda();
  const { saldos } = useSaldosConta("ponto");

  const alertas: AlertaPonto[] = pontos.map((ponto) => {
    const saldo = saldos.find((s) => s.parceiro_id === ponto.id);
    const diasSemEntrega = saldo?.ultima_entrega ? diffDias(saldo.ultima_entrega) : null;
    // consumo médio diário: entregas dos últimos 30 dias / 30, com fallback na média cadastrada
    const consumoDiario =
      saldo && saldo.entregas_30d > 0
        ? saldo.entregas_30d / 30
        : ponto.media_botijoes > 0
        ? ponto.media_botijoes / 15
        : 0;

    const estoqueEstimado =
      ponto.media_botijoes > 0 ? ponto.media_botijoes : saldo?.entregas_30d ?? 0;
    const diasEstimadosRestantes =
      consumoDiario > 0 && diasSemEntrega !== null
        ? Math.round(estoqueEstimado / consumoDiario - diasSemEntrega)
        : null;

    let urgencia: AlertaPonto["urgencia"] = "ok";
    if (diasEstimadosRestantes !== null) {
      if (diasEstimadosRestantes <= 0) urgencia = "urgente";
      else if (diasEstimadosRestantes <= 3) urgencia = "atencao";
    }

    return {
      ponto,
      diasSemEntrega,
      botijoesDevidos: saldo?.botijoes_devidos ?? 0,
      consumoDiario,
      diasEstimadosRestantes,
      urgencia,
    };
  });

  const ordem = { urgente: 0, atencao: 1, ok: 2 } as const;
  alertas.sort((a, b) => ordem[a.urgencia] - ordem[b.urgencia]);

  return { alertas, isLoading };
}
