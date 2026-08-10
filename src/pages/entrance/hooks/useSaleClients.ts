import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaleClient {
  id: string;
  name: string;
  phone: string;
  origem?: "cliente" | "ponto";
}

/** Clientes reais da base (menu Clientes) + pontos de revenda, para uso nas vendas da portaria. */
export function useSaleClients() {
  return useQuery({
    queryKey: ["sale_clients"],
    queryFn: async (): Promise<SaleClient[]> => {
      const [clientsRes, pontosRes] = await Promise.all([
        supabase.from("clients").select("id, name, phone").order("name", { ascending: true }),
        supabase
          .from("pontos_revenda" as any)
          .select("id, nome, telefone, povoado, ativo")
          .eq("ativo", true)
          .order("nome", { ascending: true }),
      ]);

      if (clientsRes.error) throw clientsRes.error;

      const clientes: SaleClient[] = (clientsRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        origem: "cliente" as const,
      }));

      const pontos: SaleClient[] = pontosRes.error
        ? []
        : ((pontosRes.data as any[]) || []).map((p: any) => ({
            id: p.id,
            name: p.povoado ? `${p.nome} (${p.povoado})` : p.nome,
            phone: p.telefone || "",
            origem: "ponto" as const,
          }));

      return [...clientes, ...pontos].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    },
    staleTime: 60_000,
  });
}
