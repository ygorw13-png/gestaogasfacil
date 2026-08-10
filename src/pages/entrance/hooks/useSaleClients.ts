import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaleClient {
  id: string;
  name: string;
  phone: string;
}

/** Clientes reais da base (menu Clientes) para uso nas vendas da portaria. */
export function useSaleClients() {
  return useQuery({
    queryKey: ["sale_clients"],
    queryFn: async (): Promise<SaleClient[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "",
      }));
    },
    staleTime: 60_000,
  });
}
