import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Backend fictício controlado por teste (nenhum dado real)
const state: { tables: Record<string, { data: any; error: any }>; inserts: any[] } = {
  tables: {},
  inserts: [],
};
const builder = (table: string) => {
  const res = () => state.tables[table] ?? { data: [], error: null };
  const b: any = {
    select: () => b, gte: () => b, lte: () => b, eq: () => b, order: () => b,
    single: () => Promise.resolve(res()),
    insert: (row: any) => { state.inserts.push({ table, row }); return b; },
    then: (ok: any, ko: any) => Promise.resolve(res()).then(ok, ko),
  };
  return b;
};
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (t: string) => builder(t),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "u-ficticio" } } }) },
  },
}));
const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastSpy }) }));

import { orderTotal, sumRevenue } from "@/lib/orderMetrics";
import { generateReportData } from "@/pages/dashboard/components/reports/utils/reportDataGenerator";
import { useDashboardOverview } from "@/pages/dashboard/hooks/useDashboardData";
import { buildCashierDataFromVendasPorData } from "@/pages/entrance/utils/closingCalculations";
import { useOrderMutations } from "@/pages/orders/hooks/useOrderMutations";

const wrapper = ({ children }: any) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const now = new Date().toISOString();
const rows = [
  { product: "GLP P13", quantity: 2, price: 250, status: "delivered", created_at: now },
  { product: "GLP P13", quantity: 1, price: 125, status: "pending", created_at: now },
  { product: "Água 20L", quantity: 2, price: 20, status: "cancelled", created_at: now },
];

beforeEach(() => {
  state.tables = {};
  state.inserts = [];
  toastSpy.mockReset();
});

describe("valor da venda", () => {
  it("price é o total: 2 botijões gravados a R$ 250 valem R$ 250, não R$ 500", () => {
    expect(orderTotal({ price: 250, quantity: 2 })).toBe(250);
  });
  it("cancelados ficam fora; demais estados contam", () => {
    expect(sumRevenue(rows)).toBe(375);
  });
});

describe("indicadores e Excel usam a mesma regra", () => {
  it("Excel do dia soma o mesmo valor que o indicador de vendas de hoje", async () => {
    state.tables.orders = { data: rows, error: null };
    state.tables.saldo_portaria_atual = { data: [], error: null };
    state.tables.promissory_notes = { data: [], error: null };
    const today = new Date();
    const report = await generateReportData({ from: today, to: today });
    const { result } = renderHook(() => useDashboardOverview(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(report.totais.vendasTotais).toBe(375);
    expect(result.current.data!.todaySalesValue).toBe(375);
    expect(report.totais.pedidos).toBe(result.current.data!.ordersToday);
  });
});

describe("falha x ausência", () => {
  it("falha de consulta vira erro (indisponível), não zero", async () => {
    state.tables.orders = { data: null, error: { message: "falha" } };
    const { result } = renderHook(() => useDashboardOverview(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
  it("ausência real de vendas vira zero", async () => {
    const { result } = renderHook(() => useDashboardOverview(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.todaySalesValue).toBe(0);
    expect(result.current.data!.ordersToday).toBe(0);
  });
  it("Excel com falha de consulta não gera planilha com zeros", async () => {
    state.tables.orders = { data: null, error: { message: "falha" } };
    const d = new Date();
    await expect(generateReportData({ from: d, to: d })).rejects.toBeTruthy();
  });
});

describe("gravação de pedido", () => {
  const order: any = { clientName: "Cliente Ficticio", product: "GLP P13", quantity: 1, price: 125, tipoVenda: "recarga" };
  it("falha: lança erro e não adiciona pedido à lista", async () => {
    state.tables.orders = { data: null, error: { message: "recusado" } };
    const setOrders = vi.fn();
    const { result } = renderHook(() => useOrderMutations([], setOrders));
    await expect(act(() => result.current.handleAddOrder(order))).rejects.toBeTruthy();
    expect(setOrders).not.toHaveBeenCalled();
    expect(toastSpy.mock.calls.every(([t]) => t.variant === "destructive")).toBe(true);
  });
  it("sucesso: devolve o ID persistido pelo banco", async () => {
    state.tables.orders = {
      data: { id: "id-gravado-123", client_name: "Cliente Ficticio", product: "GLP P13", quantity: 1, price: 125, payment_method: "pix", created_at: now, status: "pending" },
      error: null,
    };
    const { result } = renderHook(() => useOrderMutations([], vi.fn()));
    let saved: any;
    await act(async () => { saved = await result.current.handleAddOrder(order); });
    expect(saved.id).toBe("id-gravado-123");
    expect(saved.paymentMethod).toBe("pix");
  });
});

describe("fechamento parcial", () => {
  it("retrato divide por forma de pagamento e soma exatamente o total do dia", () => {
    const snap = buildCashierDataFromVendasPorData({
      totalSales: 400,
      byPayment: { Dinheiro: 250, PIX: 100, Promissória: 50 },
      quantitiesByPayment: {},
      glpSales: { p13: 3, p20: 0, p45: 0 },
      waterSales: 0,
      recentSales: [],
      firstSaleAt: null,
    });
    expect(snap.cash).toBe(250);
    expect(snap.pix).toBe(100);
    expect(snap.promissory).toBe(50);
    expect(snap.cash + snap.pix + snap.credit + snap.debit + snap.promissory + snap.gasVoucher).toBe(snap.totalSales);
  });
});
