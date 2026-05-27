import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientPurchase {
  id: string;
  date: string;
  product: string;
  quantity: number;
  amount: number;
  paymentMethod: string;
}

export function useClientPurchases(clientId?: string, clientName?: string) {
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId && !clientName) { setPurchases([]); return; }
    (async () => {
      setLoading(true);
      let q = supabase.from("orders").select("id, created_at, product, quantity, price, payment_method, client_name").order("created_at", { ascending: false });
      if (clientName) q = q.eq("client_name", clientName);
      const { data, error } = await q;
      setLoading(false);
      if (error || !data) { setPurchases([]); return; }
      setPurchases(data.map((o: any) => ({
        id: o.id,
        date: o.created_at,
        product: o.product || "—",
        quantity: o.quantity || 0,
        amount: Number(o.price) || 0,
        paymentMethod: o.payment_method || "—",
      })));
    })();
  }, [clientId, clientName]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
  const formatCurrency = (a: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(a);

  return { purchases, loading, formatDate, formatCurrency };
}
