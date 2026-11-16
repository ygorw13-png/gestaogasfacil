import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sale } from "../types/entranceTypes";
import { paymentLabelFromCode, productKey } from "./useVendasHoje";

export interface QuantitiesByPayment {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export interface VendasPorData {
  totalSales: number;
  byPayment: Record<string, number>;
  quantitiesByPayment: Record<string, QuantitiesByPayment>;
  glpSales: { p13: number; p20: number; p45: number };
  waterSales: number;
  recentSales: Sale[];
  firstSaleAt: Date | null;
}

const dayBounds = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  d.setHours(23, 59, 59, 999);
  const end = d.toISOString();
  return { start, end };
};

const emptyQuantities = (): QuantitiesByPayment => ({ p13: 0, p20: 0, p45: 0, water: 0 });

export function useVendasPorData(dateStr: string | null) {
  return useQuery({
    queryKey: ["vendas_por_data", dateStr],
    enabled: !!dateStr,
    queryFn: async (): Promise<VendasPorData> => {
      if (!dateStr) {
        return {
          totalSales: 0,
          byPayment: {},
          quantitiesByPayment: {},
          glpSales: { p13: 0, p20: 0, p45: 0 },
          waterSales: 0,
          recentSales: [],
          firstSaleAt: null,
        };
      }
      const { start, end } = dayBounds(dateStr);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "delivered")
        .gte("delivered_at", start)
        .lte("delivered_at", end)
        .order("delivered_at", { ascending: false });

      if (error) throw error;

      const rows = data || [];
      const result: VendasPorData = {
        totalSales: 0,
        byPayment: {},
        quantitiesByPayment: {},
        glpSales: { p13: 0, p20: 0, p45: 0 },
        waterSales: 0,
        recentSales: [],
        firstSaleAt: null,
      };

      rows.forEach((o: any) => {
        const amount = Number(o.price) || 0;
        const qty = Number(o.quantity) || 0;
        result.totalSales += amount;

        const label = paymentLabelFromCode(o.payment_method);
        result.byPayment[label] = (result.byPayment[label] || 0) + amount;

        const qts = result.quantitiesByPayment[label] || emptyQuantities();
        const key = productKey(o.product);
        if (key === "water") qts.water += qty;
        else if (key) qts[key] += qty;
        result.quantitiesByPayment[label] = qts;

        const globalKey = productKey(o.product);
        if (globalKey === "water") result.waterSales += qty;
        else if (globalKey) result.glpSales[globalKey] += qty;
      });

      const oldest = rows[rows.length - 1];
      result.firstSaleAt = oldest?.delivered_at ? new Date(oldest.delivered_at) : null;

      result.recentSales = rows.slice(0, 8).map((o: any) => ({
        id: o.id,
        time: o.delivered_at
          ? new Date(o.delivered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "",
        client: o.client_name || "Venda Avulsa",
        product: o.product || "",
        quantity: Number(o.quantity) || 0,
        payment: paymentLabelFromCode(o.payment_method),
        paymentCode: o.payment_method ?? undefined,
        amount: Number(o.price) || 0,
        valorInformado: o.price !== null && o.price !== undefined,
      })) as Sale[];

      return result;
    },
  });
}

