import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sale } from "../types/entranceTypes";
import { normalizarTipoVenda } from "@/lib/saleTypes";

export interface VendasHoje {
  totalSales: number;
  byPayment: Record<string, number>;
  glpSales: { p13: number; p20: number; p45: number };
  waterSales: number;
  recentSales: Sale[];
  firstSaleAt: Date | null;
}

// Mapeia os códigos gravados em orders.payment_method para os rótulos exibidos
export const paymentLabelFromCode = (code?: string | null): string => {
  switch (code) {
    case "money":
    case "cash":
      return "Dinheiro";
    case "credit":
      return "Crédito";
    case "debit":
      return "Débito";
    case "pix":
      return "PIX";
    case "promissoria":
    case "promissory":
      return "Promissória";
    case "vale-gas":
    case "gasVoucher":
    case "voucher":
      return "Vale Gás";
    case "gas-povo":
      return "Gás-Povo";
    case "convenio":
      return "Convênio";
    default:
      return "Outros";
  }
};

export const productKey = (product?: string | null): "p13" | "p20" | "p45" | "water" | null => {
  const p = (product || "").toUpperCase();
  if (p.includes("P13")) return "p13";
  if (p.includes("P20")) return "p20";
  if (p.includes("P45")) return "p45";
  if (p.includes("ÁGUA") || p.includes("AGUA") || p.includes("WATER")) return "water";
  return null;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export function useVendasHoje() {
  return useQuery({
    queryKey: ["vendas_hoje", new Date().toISOString().slice(0, 10)],
    refetchInterval: 30000,
    queryFn: async (): Promise<VendasHoje> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "delivered")
        .gte("delivered_at", startOfToday())
        .order("delivered_at", { ascending: false });

      if (error) throw error;

      const rows = data || [];
      const result: VendasHoje = {
        totalSales: 0,
        byPayment: {},
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

        const key = productKey(o.product);
        if (key === "water") result.waterSales += qty;
        else if (key) result.glpSales[key] += qty;
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
        paymentCode: o.payment_method || "money",
        amount: Number(o.price) || 0,
        tipoVenda: (normalizarTipoVenda(o.tipo_venda) ?? "recarga") as Sale["tipoVenda"],
        vasilhamesEntregues: Number(o.vasilhames_entregues) || 0,
        vasilhamesRecebidos: Number(o.vasilhames_recebidos) || 0,
      })) as Sale[];

      return result;
    },
  });
}
