import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Timeframe = "today" | "week" | "month";

const db = supabase as any;

const iso = (d: Date) => d.toISOString();
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function rangeStart(timeframe: Timeframe) {
  const now = new Date();
  if (timeframe === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (timeframe === "week") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - 6);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const isWater = (product?: string | null) =>
  (product || "").toLowerCase().includes("gua") || (product || "").toLowerCase() === "water";

const orderTotal = (o: any) => Number(o.price || 0) * Number(o.quantity || 1);

/** Vendas concluídas em um intervalo */
async function fetchOrders(from: Date) {
  const { data, error } = await db
    .from("orders")
    .select("id, product, quantity, price, status, delivery_person, created_at, delivered_at")
    .gte("created_at", iso(from))
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).filter((o: any) => o.status !== "cancelled");
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard", "overview", dayKey(new Date())],
    queryFn: async () => {
      const start = rangeStart("today");
      const yesterday = new Date(start);
      yesterday.setDate(yesterday.getDate() - 1);

      const [ordersRes, saldoRes, promRes] = await Promise.all([
        db
          .from("orders")
          .select("price, quantity, status, created_at")
          .gte("created_at", iso(yesterday)),
        db.from("saldo_portaria_atual").select("*").eq("data_operacao", dayKey(new Date())),
        db.from("promissory_notes").select("value, status, due_date"),
      ]);

      const orders = (ordersRes.data || []).filter((o: any) => o.status !== "cancelled");
      const todaySalesValue = orders
        .filter((o: any) => new Date(o.created_at) >= start)
        .reduce((s: number, o: any) => s + orderTotal(o), 0);
      const yesterdayValue = orders
        .filter((o: any) => new Date(o.created_at) < start)
        .reduce((s: number, o: any) => s + orderTotal(o), 0);

      const saldo: Record<string, any> = {};
      (saldoRes.data || []).forEach((r: any) => (saldo[r.produto] = r));

      const pending = (promRes.data || []).filter((p: any) => p.status !== "paid");
      const promissoryValue = pending.reduce((s: number, p: any) => s + Number(p.value || 0), 0);
      const overdue = pending.filter(
        (p: any) => p.due_date && new Date(p.due_date) < new Date()
      );

      const variation =
        yesterdayValue > 0
          ? ((todaySalesValue - yesterdayValue) / yesterdayValue) * 100
          : todaySalesValue > 0
          ? 100
          : 0;

      return {
        todaySalesValue,
        variation,
        ordersToday: orders.filter((o: any) => new Date(o.created_at) >= start).length,
        stock: {
          gasP13: saldo.P13?.cheios ?? 0,
          gasP20: saldo.P20?.cheios ?? 0,
          gasP45: saldo.P45?.cheios ?? 0,
          water: saldo.agua?.cheios ?? 0,
          vaziosP13: saldo.P13?.vazios ?? 0,
          vaziosAgua: saldo.agua?.vazios ?? 0,
          emprestadosP13: saldo.P13?.emprestados ?? 0,
        },
        promissoryNotes: pending.length,
        promissoryValue,
        promissoryOverdue: overdue.length,
      };
    },
    refetchInterval: 60_000,
  });
}

export function useSalesSeries(timeframe: Timeframe) {
  return useQuery({
    queryKey: ["dashboard", "sales-series", timeframe],
    queryFn: async () => {
      const from = rangeStart(timeframe);
      const orders = await fetchOrders(from);

      const buckets = new Map<string, { name: string; gas: number; water: number; valor: number }>();

      if (timeframe === "today") {
        for (let h = 0; h < 24; h++) {
          const key = String(h).padStart(2, "0");
          buckets.set(key, { name: `${key}h`, gas: 0, water: 0, valor: 0 });
        }
      } else {
        const days = timeframe === "week" ? 7 : new Date().getDate();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = dayKey(d);
          buckets.set(key, {
            name: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            gas: 0,
            water: 0,
            valor: 0,
          });
        }
      }

      orders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = timeframe === "today" ? String(d.getHours()).padStart(2, "0") : dayKey(d);
        const bucket = buckets.get(key);
        if (!bucket) return;
        const qty = Number(o.quantity || 1);
        if (isWater(o.product)) bucket.water += qty;
        else bucket.gas += qty;
        bucket.valor += orderTotal(o);
      });

      return Array.from(buckets.values());
    },
    refetchInterval: 60_000,
  });
}

export function useStockDistribution() {
  return useQuery({
    queryKey: ["dashboard", "stock-distribution", dayKey(new Date())],
    queryFn: async () => {
      const { data, error } = await db
        .from("saldo_portaria_atual")
        .select("*")
        .eq("data_operacao", dayKey(new Date()));
      if (error) throw error;

      const labels: Record<string, string> = {
        P13: "P13",
        P20: "P20",
        P45: "P45",
        agua: "Água",
      };

      return Object.keys(labels).map((produto) => {
        const row = (data || []).find((r: any) => r.produto === produto);
        return {
          name: labels[produto],
          cheio: row?.cheios ?? 0,
          vazio: row?.vazios ?? 0,
          emprestado: row?.emprestados ?? 0,
        };
      });
    },
    refetchInterval: 60_000,
  });
}

export function useTopSellers(timeframe: Timeframe = "month") {
  return useQuery({
    queryKey: ["dashboard", "top-sellers", timeframe],
    queryFn: async () => {
      const orders = await fetchOrders(rangeStart(timeframe));
      const map = new Map<string, { name: string; sales: number; value: number }>();
      orders.forEach((o: any) => {
        const name = o.delivery_person || "Portaria / Balcão";
        const current = map.get(name) || { name, sales: 0, value: 0 };
        current.sales += 1;
        current.value += orderTotal(o);
        map.set(name, current);
      });
      return Array.from(map.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
        .map((s, i) => ({ id: i + 1, ...s }));
    },
    refetchInterval: 60_000,
  });
}

export function usePromissoryAnalytics() {
  return useQuery({
    queryKey: ["dashboard", "promissory-analytics"],
    queryFn: async () => {
      const { data, error } = await db
        .from("promissory_notes")
        .select("value, paid_amount, status, due_date, paid_at, created_at");
      if (error) throw error;
      const notes = data || [];
      const paid = notes.filter((n: any) => n.status === "paid" && n.paid_at);

      // últimos 7 dias
      const dailyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = dayKey(d);
        const value = paid
          .filter((n: any) => dayKey(new Date(n.paid_at)) === key)
          .reduce((s: number, n: any) => s + Number(n.paid_amount ?? n.value ?? 0), 0);
        return { name: d.toLocaleDateString("pt-BR", { weekday: "short" }), value };
      });

      // últimas 4 semanas
      const weeklyData = Array.from({ length: 4 }, (_, i) => {
        const end = new Date();
        end.setDate(end.getDate() - (3 - i) * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        const value = paid
          .filter((n: any) => {
            const d = new Date(n.paid_at);
            return d >= start && d <= end;
          })
          .reduce((s: number, n: any) => s + Number(n.paid_amount ?? n.value ?? 0), 0);
        return { name: `Semana ${i + 1}`, value };
      });

      // últimos 6 meses
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i), 1);
        const value = paid
          .filter((n: any) => {
            const p = new Date(n.paid_at);
            return p.getMonth() === d.getMonth() && p.getFullYear() === d.getFullYear();
          })
          .reduce((s: number, n: any) => s + Number(n.paid_amount ?? n.value ?? 0), 0);
        return { name: d.toLocaleDateString("pt-BR", { month: "short" }), value };
      });

      const pending = notes.filter((n: any) => n.status !== "paid");
      const receivable = pending.reduce((s: number, n: any) => s + Number(n.value || 0), 0);
      const overdueValue = pending
        .filter((n: any) => n.due_date && new Date(n.due_date) < new Date())
        .reduce((s: number, n: any) => s + Number(n.value || 0), 0);

      const projectionData = {
        daily: {
          recommended: Math.round(receivable / 30),
          current: Math.round(dailyData[dailyData.length - 1]?.value || 0),
        },
        weekly: {
          recommended: Math.round(receivable / 4),
          current: Math.round(weeklyData[weeklyData.length - 1]?.value || 0),
        },
        monthly: {
          recommended: Math.round(receivable),
          current: Math.round(monthlyData[monthlyData.length - 1]?.value || 0),
        },
        total: { receivable: Math.round(receivable), overdue: Math.round(overdueValue) },
      };

      return { dailyData, weeklyData, monthlyData, projectionData };
    },
    refetchInterval: 60_000,
  });
}
