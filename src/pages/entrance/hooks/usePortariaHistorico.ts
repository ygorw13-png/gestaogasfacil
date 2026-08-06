import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MovimentacaoPortaria, PortariaProduto } from "./usePortariaStock";

export interface ResumoDia {
  data: string;
  vendas: number;
  devolucoes: number;
  recebidos: number;
  enviados: number;
  ajustes: number;
  aberturaRegistrada: boolean;
  fechamentoRegistrado: boolean;
}

export interface DivergenciaOperador {
  operador: string;
  ocorrencias: number;
  totalCheios: number;
  totalVazios: number;
}

const isVenda = (t: string) => t === "venda" || t === "venda_comodato";

export function useMovimentacoesPeriodo(inicio: string, fim: string) {
  return useQuery({
    queryKey: ["movimentacoes_portaria_periodo", inicio, fim],
    queryFn: async (): Promise<MovimentacaoPortaria[]> => {
      const { data, error } = await (supabase as any)
        .from("movimentacoes_portaria")
        .select("*")
        .gte("data_operacao", inicio)
        .lte("data_operacao", fim)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data || []) as MovimentacaoPortaria[];
    },
  });
}

export function resumirPorDia(movs: MovimentacaoPortaria[]): ResumoDia[] {
  const map = new Map<string, ResumoDia>();
  movs.forEach((m) => {
    const cur =
      map.get(m.data_operacao) ??
      {
        data: m.data_operacao,
        vendas: 0,
        devolucoes: 0,
        recebidos: 0,
        enviados: 0,
        ajustes: 0,
        aberturaRegistrada: false,
        fechamentoRegistrado: false,
      };

    if (isVenda(m.tipo)) cur.vendas += Math.abs(m.delta_cheios);
    if (m.tipo === "devolucao_vasilhame") cur.devolucoes += Math.abs(m.delta_vazios);
    if (m.tipo === "transferencia_patio_para_portaria") cur.recebidos += Math.abs(m.delta_cheios);
    if (m.tipo === "transferencia_portaria_para_patio") cur.enviados += Math.abs(m.delta_cheios);
    if (m.tipo === "ajuste") cur.ajustes += 1;
    if (m.tipo === "abertura") cur.aberturaRegistrada = true;
    if (m.tipo === "fechamento") cur.fechamentoRegistrado = true;

    map.set(m.data_operacao, cur);
  });
  return Array.from(map.values()).sort((a, b) => (a.data < b.data ? 1 : -1));
}

export function divergenciasPorOperador(movs: MovimentacaoPortaria[]): DivergenciaOperador[] {
  const map = new Map<string, DivergenciaOperador>();
  movs
    .filter((m) => m.tipo === "ajuste")
    .forEach((m) => {
      const key = m.registrado_por_nome || "Não identificado";
      const cur = map.get(key) ?? { operador: key, ocorrencias: 0, totalCheios: 0, totalVazios: 0 };
      cur.ocorrencias += 1;
      cur.totalCheios += m.delta_cheios;
      cur.totalVazios += m.delta_vazios;
      map.set(key, cur);
    });
  return Array.from(map.values()).sort((a, b) => b.ocorrencias - a.ocorrencias);
}

export function saldoFinalDoDia(
  movs: MovimentacaoPortaria[],
): Record<PortariaProduto, { cheios: number; vazios: number; emprestados: number }> {
  const base: Record<string, { cheios: number; vazios: number; emprestados: number }> = {
    P13: { cheios: 0, vazios: 0, emprestados: 0 },
    P20: { cheios: 0, vazios: 0, emprestados: 0 },
    P45: { cheios: 0, vazios: 0, emprestados: 0 },
    agua: { cheios: 0, vazios: 0, emprestados: 0 },
  };
  movs.forEach((m) => {
    const b = base[m.produto];
    if (!b) return;
    b.cheios += m.delta_cheios;
    b.vazios += m.delta_vazios;
    b.emprestados += m.delta_emprestados;
  });
  return base as Record<PortariaProduto, { cheios: number; vazios: number; emprestados: number }>;
}
