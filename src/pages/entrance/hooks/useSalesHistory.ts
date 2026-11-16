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
  paymentCode: string;
  amount: number;
  /** false = valor não informado (preço NULL no banco). */
  valorInformado: boolean;
  status: "delivered" | "cancelled";
  seller: string;
  /** Preenchido quando a venda foi feita para um agregado/revendedor */
  resellerId?: string | null;
  resellerName?: string | null;
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

const COLS =
  "id, client_name, product, quantity, price, payment_method, delivered_at, created_at, status, delivery_person, reseller_id";

export function useSalesHistory(from: Date, to: Date) {
  const start = startOf(from).toISOString();
  const end = endOf(to).toISOString();

  return useQuery({
    queryKey: ["sales_history", start, end],
    refetchInterval: 60000,
    queryFn: async (): Promise<HistorySale[]> => {
      const [entregues, cancelados] = await Promise.all([
        supabase
          .from("orders")
          .select(COLS)
          .in("status", ["delivered", "cancelled"])
          .gte("delivered_at", start)
          .lte("delivered_at", end),
        supabase
          .from("orders")
          .select(COLS)
          .eq("status", "cancelled")
          .is("delivered_at", null)
          .gte("created_at", start)
          .lte("created_at", end),
      ]);

      if (entregues.error) throw entregues.error;
      if (cancelados.error) throw cancelados.error;

      const rows = [...(entregues.data || []), ...(cancelados.data || [])] as any[];

      // Todos os agregados/revendedores: usados para identificar vendas feitas
      // para eles mesmo quando o pedido não gravou o reseller_id (venda pelo nome).
      const { data: rs } = await supabase.from("resellers").select("id, name");
      const resellerMap = new Map<string, string>();
      const resellerByName = new Map<string, { id: string; name: string }>();
      (rs || []).forEach((r: any) => {
        resellerMap.set(r.id, r.name);
        resellerByName.set(String(r.name).trim().toLowerCase(), { id: r.id, name: r.name });
      });

      return rows
        .map((o) => {
          const dt = new Date((o.delivered_at as string) || (o.created_at as string));
          const nomeCliente = ((o.client_name as string) || "").trim().toLowerCase();
          const agregado =
            (o.reseller_id && { id: o.reseller_id as string, name: resellerMap.get(o.reseller_id) || "Agregado" }) ||
            resellerByName.get(nomeCliente) ||
            null;
          const seller =
            agregado?.name ||
            (o.delivery_person as string) ||
            "Portaria";
          return {
            id: o.id as string,
            date: dt,
            time: dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            client: (o.client_name as string) || "Consumidor",
            product: (o.product as string) || "—",
            quantity: Number(o.quantity ?? 1),
            payment: paymentLabelFromCode(o.payment_method as string | null),
            paymentCode: (o.payment_method as string) || "",
            amount: Number(o.price ?? 0),
            valorInformado: o.price !== null && o.price !== undefined,
            status: (o.status === "cancelled" ? "cancelled" : "delivered") as
              | "delivered"
              | "cancelled",
            seller,
            resellerId: agregado?.id || null,
            resellerName: agregado?.name || null,
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });
}

export interface EstoqueRetirado {
  P13: number;
  P20: number;
  P45: number;
  agua: number;
}

/** Saídas de cheios registradas na portaria no período (para conferência com as vendas). */
export function useEstoqueRetirado(from: Date, to: Date) {
  const start = startOf(from).toISOString().slice(0, 10);
  const end = endOf(to).toISOString().slice(0, 10);

  return useQuery({
    queryKey: ["estoque_retirado", start, end],
    refetchInterval: 60000,
    queryFn: async (): Promise<EstoqueRetirado> => {
      const { data, error } = await supabase
        .from("movimentacoes_portaria" as any)
        .select("produto, delta_cheios, tipo, data_operacao")
        .gte("data_operacao", start)
        .lte("data_operacao", end);
      if (error) throw error;

      const totals: EstoqueRetirado = { P13: 0, P20: 0, P45: 0, agua: 0 };
      (data as any[] | null)?.forEach((m) => {
        const delta = Number(m.delta_cheios) || 0;
        if (delta >= 0) return;
        const key = String(m.produto) as keyof EstoqueRetirado;
        if (key in totals) totals[key] += -delta;
      });
      return totals;
    },
  });
}
