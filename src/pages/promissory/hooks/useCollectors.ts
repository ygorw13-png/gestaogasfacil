import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { G1_ACOES, acao } from "@/lib/g1/acoes";

export interface Cobrador {
  id: string;
  nome: string;
}

/**
 * Cobradores reais: colaboradores ativos da organização, identificados por ID (nunca por nome).
 * Com G1, vem da lista limitada (id, nome, situação), sem dados pessoais.
 */
export function useCollectors() {
  return useQuery({
    queryKey: ["promissory", "collectors"],
    queryFn: async (): Promise<Cobrador[]> => {
      if (G1_ACOES) {
        const rows = await acao<{ id: string; nome: string; situacao: string }[]>("listar_cobradores", {});
        return (rows || []).filter((c) => c.situacao === "ativo").map((c) => ({ id: c.id, nome: c.nome }));
      }
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome")
        .eq("situacao", "ativo")
        .order("nome");
      if (error) throw error;
      return (data || []).map((c: { id: string; nome: string }) => ({ id: c.id, nome: c.nome }));
    },
    staleTime: 60_000,
  });
}
