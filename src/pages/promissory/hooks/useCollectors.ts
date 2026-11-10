import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { G1_ACOES, acao } from "@/lib/g1/acoes";

/**
 * Cobradores reais: colaboradores ativos da organização.
 * Substitui a lista demonstrativa fixa de nomes.
 */
export function useCollectors() {
  return useQuery({
    queryKey: ["promissory", "collectors"],
    queryFn: async () => {
      if (G1_ACOES) {
        // Lista limitada (nome e situação) para quem pode cobrar; sem dados pessoais.
        const rows = await acao<{ nome: string; situacao: string }[]>("listar_cobradores", {});
        return (rows || []).filter((c) => c.situacao === "ativo").map((c) => c.nome);
      }
      const { data, error } = await supabase
        .from("colaboradores")
        .select("nome")
        .eq("situacao", "ativo")
        .order("nome");
      if (error) throw error;
      return (data || []).map((c) => c.nome);
    },
    staleTime: 60_000,
  });
}
