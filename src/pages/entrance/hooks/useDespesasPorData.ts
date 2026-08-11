import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DespesaDia {
  id: string;
  descricao: string;
  categoria: string | null;
  tipo: string;
  valor: number;
  origem_dinheiro: string;
  colaborador_nome: string | null;
  veiculo_placa: string | null;
}

/** Despesas lançadas em uma data específica (usado no fechamento de caixa). */
export function useDespesasPorData(date: string) {
  return useQuery({
    queryKey: ["despesas_por_data", date],
    queryFn: async (): Promise<DespesaDia[]> => {
      const { data, error } = await (supabase as any)
        .from("despesas")
        .select("id, descricao, categoria, tipo, valor, origem_dinheiro, colaborador_nome, veiculo_placa")
        .eq("data", date)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        descricao: d.descricao || "",
        categoria: d.categoria,
        tipo: d.tipo,
        valor: Number(d.valor) || 0,
        origem_dinheiro: d.origem_dinheiro || "",
        colaborador_nome: d.colaborador_nome,
        veiculo_placa: d.veiculo_placa,
      }));
    },
  });
}
