import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { paymentLabelFromCode } from "./useVendasHoje";

export interface HistorySale {
  id: string;
  date: Date;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  amount: number;
}

const startOf = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOf = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export function useSalesHistory(from: Date, to: Date) {
  const start = startOf(from).toISOString();
  const end = endOf(to).toISOString();

  return useQuery({
    queryKey: ["sales_history", start, end],
    refetchInterval: 60000,
    queryFn: async (): Promise<HistorySale[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, client_name, product, quantity, price, payment_method, delivered_at, created_at, status")
        .eq("status", "delivered")
        .gte("delivered_at", start)
        .lte("delivered_at", end)
        .order("delivered_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((o) => {
        const dt = new Date((o.delivered_at as string) || (o.created_at as string));
        return {
          id: o.id as string,
          date: dt,
          time: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          client: (o.client_name as string) || "Consumidor",
          product: (o.product as string) || "—",
          quantity: Number(o.quantity ?? 1),
          payment: paymentLabelFromCode(o.payment_method as string | null),
          amount: Number(o.price ?? 0),
        };
      });
    },
  });
}
