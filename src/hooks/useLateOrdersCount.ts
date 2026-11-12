import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Conta pedidos pendentes sem entregador atribuído há mais de 5 minutos.
 * Usado no badge do menu Portaria.
 */
export function useLateOrdersCount() {
  const { data = 0 } = useQuery({
    queryKey: ["late-orders-count"],
    queryFn: async () => {
      const limit = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("origem_venda", ["pedido", "online"])
        .is("delivery_person_id", null)
        .lt("created_at", limit);
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  return data;
}
