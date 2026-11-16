import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientPromissory {
  id: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

export function useClientPromissories(clientId?: string, clientName?: string) {
  const [promissories, setPromissories] = useState<ClientPromissory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId && !clientName) { setPromissories([]); return; }
    (async () => {
      setLoading(true);
      let q = supabase.from("promissory_notes").select("id, value, due_date, status, client_id, client_name").order("due_date", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      else if (clientName) q = q.eq("client_name", clientName);
      const { data, error } = await q;
      setLoading(false);
      if (error || !data) { setPromissories([]); return; }
      const today = new Date().toISOString().slice(0, 10);
      setPromissories(data.filter((p: any) => p.status !== "cancelled").map((p: any) => ({
        id: p.id,
        amount: Number(p.value) || 0,
        dueDate: p.due_date,
        status: p.status === "paid" ? "paid" : (p.due_date < today ? "overdue" : "pending"),
      })));
    })();
  }, [clientId, clientName]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
  const formatCurrency = (a: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(a);
  const getStatusBadgeColor = (s: string) => s === "paid" ? "bg-green-500" : s === "overdue" ? "bg-red-500" : "bg-yellow-500";

  return { promissories, loading, formatDate, formatCurrency, getStatusBadgeColor };
}
