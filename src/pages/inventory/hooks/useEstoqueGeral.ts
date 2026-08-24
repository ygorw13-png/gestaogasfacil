import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useSaldoPortaria,
  type PortariaProduto,
} from "@/pages/entrance/hooks/usePortariaStock";

export const PRODUTOS_ESTOQUE: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

export interface SaldoPatioProduto {
  produto: PortariaProduto;
  cheios: number;
  vazios: number;
}

export interface EstoqueGeralLinha {
  produto: PortariaProduto;
  label: string;
  patio_cheios: number;
  patio_vazios: number;
  portaria_cheios: number;
  portaria_vazios: number;
  emprestados: number;
  total_cheios: number;
  total_vazios: number;
}

export const produtoLabelEstoque = (p: PortariaProduto) =>
  p === "agua" ? "Água 20L" : `GLP ${p}`;

const emptyPatio = (p: PortariaProduto): SaldoPatioProduto => ({
  produto: p,
  cheios: 0,
  vazios: 0,
});

/** Saldo do pátio calculado pelas movimentações reais (entradas, ajustes e transferências). */
export function useSaldoPatio() {
  return useQuery({
    queryKey: ["estoque_geral", "patio"],
    queryFn: async (): Promise<Record<PortariaProduto, SaldoPatioProduto>> => {
      const { data, error } = await (supabase as any).from("saldo_patio").select("*");
      if (error) throw error;

      const map: Record<PortariaProduto, SaldoPatioProduto> = {
        P13: emptyPatio("P13"),
        P20: emptyPatio("P20"),
        P45: emptyPatio("P45"),
        agua: emptyPatio("agua"),
      };

      (data || []).forEach((row: any) => {
        const p = row.produto as PortariaProduto;
        if (!PRODUTOS_ESTOQUE.includes(p)) return;
        map[p] = {
          produto: p,
          cheios: (map[p].cheios || 0) + (Number(row.cheios) || 0),
          vazios: (map[p].vazios || 0) + (Number(row.vazios) || 0),
        };
      });

      return map;
    },
  });
}

/** Visão consolidada: pátio + portaria, sempre a partir das movimentações reais. */
export function useEstoqueGeral() {
  const patio = useSaldoPatio();
  const portaria = useSaldoPortaria();

  const linhas: EstoqueGeralLinha[] = PRODUTOS_ESTOQUE.map((p) => {
    const pa = patio.data?.[p];
    const po = portaria.data?.[p];
    const patio_cheios = pa?.cheios ?? 0;
    const patio_vazios = pa?.vazios ?? 0;
    const portaria_cheios = po?.cheios ?? 0;
    const portaria_vazios = po?.vazios ?? 0;
    return {
      produto: p,
      label: produtoLabelEstoque(p),
      patio_cheios,
      patio_vazios,
      portaria_cheios,
      portaria_vazios,
      emprestados: po?.emprestados ?? 0,
      total_cheios: patio_cheios + portaria_cheios,
      total_vazios: patio_vazios + portaria_vazios,
    };
  });

  return {
    linhas,
    isLoading: patio.isLoading || portaria.isLoading,
    refetch: async () => {
      await Promise.all([patio.refetch(), portaria.refetch()]);
    },
  };
}
