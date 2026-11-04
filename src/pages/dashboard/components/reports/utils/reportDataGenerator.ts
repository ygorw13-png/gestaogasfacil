
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

/**
 * Gera os dados do relatório a partir dos pedidos reais do período.
 * Custos, margem e crescimento não são calculados: não há custo de
 * mercadoria registrado no sistema, então esses campos vêm como null
 * e o relatório os exibe como "Não disponível".
 */
export const generateReportData = async (dateRange: DateRange) => {
  const from = dateRange.from!;
  const to = dateRange.to || dateRange.from!;
  const endOfDay = new Date(to);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("orders")
    .select("product, quantity, price, status, created_at")
    .gte("created_at", from.toISOString())
    .lte("created_at", endOfDay.toISOString());
  if (error) throw error;

  const orders = (data || []).filter((o) => o.status !== "cancelled");

  // Vendas diárias reais: todos os dias do período, zero quando não houve venda
  const dailySales: { data: string; valor: number }[] = [];
  const currentDate = new Date(from);
  while (currentDate <= to) {
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const valor = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= dayStart && d < dayEnd;
      })
      .reduce((sum, o) => sum + Number(o.price || 0) * Number(o.quantity || 1), 0);
    dailySales.push({
      data: format(currentDate, "dd/MM/yyyy", { locale: ptBR }),
      valor,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalSales = dailySales.reduce((sum, day) => sum + day.valor, 0);
  const averageSales = dailySales.length > 0 ? totalSales / dailySales.length : 0;

  // Produtos mais vendidos reais, por quantidade
  const byProduct = new Map<string, number>();
  orders.forEach((o) => {
    const name = o.product || "Não identificado";
    byProduct.set(name, (byProduct.get(name) || 0) + Number(o.quantity || 1));
  });
  const totalQty = Array.from(byProduct.values()).reduce((a, b) => a + b, 0);
  const topProducts = Array.from(byProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([produto, quantidade]) => ({
      produto,
      quantidade,
      percentual: totalQty > 0 ? `${((quantidade / totalQty) * 100).toFixed(1)}%` : "0%",
    }));

  return {
    periodo: {
      inicio: format(from, "dd/MM/yyyy", { locale: ptBR }),
      fim: format(to, "dd/MM/yyyy", { locale: ptBR }),
    },
    vendasDiarias: dailySales,
    totais: {
      vendasTotais: totalSales,
      mediaDiaria: averageSales,
      diasAnalisados: dailySales.length,
      pedidos: orders.length,
    },
    produtosMaisVendidos: topProducts,
    // Sem custo de mercadoria registrado: margem e crescimento não são calculáveis
    metricasFinanceiras: {
      receitaBruta: totalSales,
      custoOperacional: null as number | null,
      margemLucro: null as number | null,
      taxaCrescimento: null as number | null,
    },
    sugestoes: [] as string[],
  };
};
