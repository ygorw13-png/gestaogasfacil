import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cobradores reais: colaboradores ativos da organização.
 * Substitui a lista demonstrativa fixa de nomes.
 */
export function useCollectors() {
  return useQuery({
    queryKey: ["promissory", "collectors"],
    queryFn: async () => {
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
