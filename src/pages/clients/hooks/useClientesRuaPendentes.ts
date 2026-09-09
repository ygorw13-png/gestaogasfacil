import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClienteRuaPendente {
  nome: string;
  telefone: string;
  compras: number;
  ultimaCompra: string;
}

const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

/**
 * Clientes atendidos em vendas na rua pelos entregadores que ainda
 * não possuem cadastro na base de clientes.
 */
export function useClientesRuaPendentes() {
  return useQuery({
    queryKey: ["clientes-rua-pendentes"],
    queryFn: async (): Promise<ClienteRuaPendente[]> => {
      const [ordersRes, clientsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("client_name, client_phone, client_id, created_at, origem_venda, status")
          .eq("origem_venda", "rua")
          .is("client_id", null)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("clients").select("phone"),
      ]);
      if (ordersRes.error) throw ordersRes.error;

      const cadastrados = new Set(
        (clientsRes.data || []).map((c: any) => onlyDigits(c.phone)).filter(Boolean)
      );

      const mapa = new Map<string, ClienteRuaPendente>();
      for (const o of (ordersRes.data as any[]) || []) {
        if (o.status === "cancelled") continue;
        const fone = onlyDigits(o.client_phone);
        if (!fone || cadastrados.has(fone)) continue;
        const atual = mapa.get(fone);
        if (atual) {
          atual.compras += 1;
        } else {
          mapa.set(fone, {
            nome: o.client_name,
            telefone: o.client_phone,
            compras: 1,
            ultimaCompra: o.created_at,
          });
        }
      }
      return [...mapa.values()].sort(
        (a, b) => new Date(b.ultimaCompra).getTime() - new Date(a.ultimaCompra).getTime()
      );
    },
    staleTime: 30_000,
  });
}
