import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EntregadorApp {
  id: string;
  nome: string;
  telefone: string | null;
}

/**
 * Entregadores que possuem conta no app (profiles.role = 'entregador').
 * O id retornado é o id do usuário — é ele que deve ser gravado em
 * orders.delivery_person para que a entrega apareça no celular do entregador.
 * O telefone é buscado em colaboradores pelo nome (quando existir).
 */
export function useEntregadoresApp() {
  return useQuery({
    queryKey: ["entregadores-app"],
    queryFn: async (): Promise<EntregadorApp[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, name, ativo, role")
        .eq("role", "entregador")
        .eq("ativo", true)
        .order("name");
      if (error) throw error;

      const { data: colaboradores } = await supabase
        .from("colaboradores")
        .select("nome, telefone");

      const phoneByName = new Map<string, string | null>();
      (colaboradores ?? []).forEach((c: any) => {
        phoneByName.set(String(c.nome ?? "").trim().toLowerCase(), c.telefone ?? null);
      });

      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        nome: p.name,
        telefone: phoneByName.get(String(p.name ?? "").trim().toLowerCase()) ?? null,
      }));
    },
    staleTime: 60_000,
  });
}
