import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { acao } from "@/lib/g1/acoes";

export interface EntregadorApp {
  id: string;
  nome: string;
  telefone: string | null;
}

/**
 * Entregadores ATIVOS da empresa com conta no app, pela fonte canônica de papéis
 * (`user_roles`, função `listar_entregadores` — SQL 012). O id é o da conta: é ele que
 * vai em orders.delivery_person_id para a entrega aparecer no celular do entregador.
 * O telefone (só para o aviso no WhatsApp) vem do cadastro de colaboradores pelo nome, quando existir.
 */
export function useEntregadoresApp() {
  return useQuery({
    queryKey: ["entregadores-app"],
    queryFn: async (): Promise<EntregadorApp[]> => {
      const lista = await acao<{ id: string; nome: string }[]>("listar_entregadores", {});
      const { data: colaboradores } = await supabase.from("colaboradores").select("nome, telefone");
      const phoneByName = new Map<string, string | null>();
      (colaboradores ?? []).forEach((c) => phoneByName.set(String(c.nome ?? "").trim().toLowerCase(), c.telefone ?? null));
      return (lista ?? []).map((p) => ({
        id: p.id,
        nome: p.nome,
        telefone: phoneByName.get(String(p.nome ?? "").trim().toLowerCase()) ?? null,
      }));
    },
    staleTime: 60_000,
  });
}
