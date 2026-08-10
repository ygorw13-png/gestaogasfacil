import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Download,
  Droplets,
  Package,
  Printer,
  Receipt,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SalesFilters } from "./components/sales/SalesFilters";
import { CancelSaleButton } from "./components/sales/CancelSaleButton";
import { EditSaleButton } from "./components/sales/EditSaleButton";
import { DateRange } from "react-day-picker";
import { useSalesHistory, useEstoqueRetirado, type HistorySale } from "./hooks/useSalesHistory";
import { productKey } from "./hooks/useVendasHoje";
import { printSalesReport } from "./utils/salesReport";
import { exportToCsv } from "@/utils/csvExport";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const PRODUTO_LABELS: Record<"p13" | "p20" | "p45" | "water", string> = {
  p13: "P13",
  p20: "P20",
  p45: "P45",
  water: "Água 20L",
};

export default function SalesHistory() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: today, to: today });
  const [productFilter, setProductFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");

  const from = dateRange?.from ?? today;
  const to = dateRange?.to ?? dateRange?.from ?? today;

  const { data: sales = [], isLoading } = useSalesHistory(from, to);
  const { data: estoqueRetirado } = useEstoqueRetirado(from, to);

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ from: today, to: today });
    setProductFilter("all");
    setPaymentFilter("all");
    setSellerFilter("all");
  };

  const sellerOptions = useMemo(
    () => Array.from(new Set(sales.map((s) => s.seller).filter(Boolean))).sort(),
    [sales],
  );

  const matchesFilters = (sale: HistorySale) => {
    const matchesSearch =
      !searchTerm || sale.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === "all" || sale.product === productFilter;
    const matchesPayment = paymentFilter === "all" || sale.payment === paymentFilter;
    const matchesSeller = sellerFilter === "all" || sale.seller === sellerFilter;
    return matchesSearch && matchesProduct && matchesPayment && matchesSeller;
  };

  const allFiltered = useMemo(
    () => sales.filter(matchesFilters),
    [sales, searchTerm, productFilter, paymentFilter, sellerFilter],
  );

  const filteredSales = useMemo(
    () => allFiltered.filter((s) => s.status === "delivered"),
    [allFiltered],
  );
  const cancelledSales = useMemo(
    () => allFiltered.filter((s) => s.status === "cancelled"),
    [allFiltered],
  );

  const summary = useMemo(() => {
    const products = new Set<string>();
    const payments = new Set<string>();
    const matrix: Record<string, Record<string, { qty: number; total: number }>> = {};

    filteredSales.forEach((s) => {
      products.add(s.product);
      payments.add(s.payment);
      matrix[s.product] = matrix[s.product] || {};
      const c = matrix[s.product][s.payment] || { qty: 0, total: 0 };
      c.qty += s.quantity;
      c.total += s.amount;
      matrix[s.product][s.payment] = c;
    });

    const productList = Array.from(products).sort();
    const paymentList = Array.from(payments).sort();

    const totalQty = filteredSales.reduce((a, s) => a + s.quantity, 0);
    const totalValue = filteredSales.reduce((a, s) => a + s.amount, 0);
    const cancelledValue = cancelledSales.reduce((a, s) => a + s.amount, 0);
    const cancelledQty = cancelledSales.reduce((a, s) => a + s.quantity, 0);

    const productTotals = { p13: 0, p20: 0, p45: 0, water: 0 };
    filteredSales.forEach((s) => {
      const key = productKey(s.product);
      if (key === "water") productTotals.water += s.quantity;
      else if (key) productTotals[key] += s.quantity;
    });

    return {
      productList,
      paymentList,
      matrix,
      totalQty,
      totalValue,
      cancelledValue,
      cancelledQty,
      netValue: totalValue - cancelledValue,
      productTotals,
    };
  }, [filteredSales, cancelledSales]);

  const cell = (p: string, pay: string) => summary.matrix[p]?.[pay];

  const conferencia = useMemo(() => {
    const retirado = estoqueRetirado || { P13: 0, P20: 0, P45: 0, agua: 0 };
    const map: { key: keyof typeof summary.productTotals; label: string; retirado: number }[] = [
      { key: "p13", label: "P13", retirado: retirado.P13 },
      { key: "p20", label: "P20", retirado: retirado.P20 },
      { key: "p45", label: "P45", retirado: retirado.P45 },
      { key: "water", label: "Água 20L", retirado: retirado.agua },
    ];
    return map.map((m) => {
      const vendido = summary.productTotals[m.key];
      return { produto: m.label, vendido, retirado: m.retirado, diferenca: vendido - m.retirado };
    });
  }, [estoqueRetirado, summary.productTotals]);

  
  const filtroAtivo =
    productFilter !== "all" || paymentFilter !== "all" || sellerFilter !== "all" || !!searchTerm;

  const periodoLabel = `${from.toLocaleDateString("pt-BR")} a ${to.toLocaleDateString("pt-BR")}`;

  const buildReport = () => ({
    periodo: periodoLabel,
    vendedor: sellerFilter === "all" ? "Todos" : sellerFilter,
    qtdVendas: filteredSales.length,
    totalVendido: summary.totalValue,
    totalCancelado: summary.cancelledValue,
    totalLiquido: summary.netValue,
    produtos: summary.productTotals,
    pagamentos: summary.paymentList.map((pay) => ({
      nome: pay,
      qtd: summary.productList.reduce((a, prod) => a + (cell(prod, pay)?.qty || 0), 0),
      total: summary.productList.reduce((a, prod) => a + (cell(prod, pay)?.total || 0), 0),
    })),
    matriz: summary.productList.map((prod) => ({
      produto: prod,
      celulas: summary.paymentList
        .map((pay) => ({
          pagamento: pay,
          qtd: cell(prod, pay)?.qty || 0,
          total: cell(prod, pay)?.total || 0,
        }))
        .filter((c) => c.qtd || c.total),
      qtd: summary.paymentList.reduce((a, pay) => a + (cell(prod, pay)?.qty || 0), 0),
      total: summary.paymentList.reduce((a, pay) => a + (cell(prod, pay)?.total || 0), 0),
    })),
    conferencia,
  });

  const exportarCsv = () => {
    exportToCsv(
      `vendas-${from.toISOString().slice(0, 10)}-a-${to.toISOString().slice(0, 10)}.csv`,
      [
        { header: "Data", accessor: (s: HistorySale) => s.date.toLocaleDateString("pt-BR") },
        { header: "Horário", accessor: (s: HistorySale) => s.time },
        { header: "Cliente", accessor: (s: HistorySale) => s.client },
        { header: "Vendedor", accessor: (s: HistorySale) => s.seller },
        { header: "Produto", accessor: (s: HistorySale) => s.product },
        { header: "Quantidade", accessor: (s: HistorySale) => s.quantity },
        { header: "Pagamento", accessor: (s: HistorySale) => s.payment },
        { header: "Valor", accessor: (s: HistorySale) => s.amount.toFixed(2) },
        {
          header: "Situação",
          accessor: (s: HistorySale) => (s.status === "cancelled" ? "Cancelada" : "Concluída"),
        },
      ],
      allFiltered,
    );
  };

  return (
    <div className="space-y-6 animate-in pb-20">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/entrance")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCsv}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button size="sm" onClick={() => printSalesReport(buildReport())}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir relatório
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        {(["p13", "p20", "p45", "water"] as const).map((key) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {PRODUTO_LABELS[key]}
              </CardTitle>
              {key === "water" ? (
                <Droplets className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.productTotals[key]}</div>
              <p className="text-xs text-muted-foreground">unidades</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              ticket médio{" "}
              {brl(filteredSales.length ? summary.totalValue / filteredSales.length : 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total vendido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredSales.length} vendas · {summary.totalQty} un.
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelamentos / estornos
            </CardTitle>
            <Ban className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{brl(summary.cancelledValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {cancelledSales.length} vendas · {summary.cancelledQty} un.
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(summary.netValue)}</div>
            <p className="text-xs text-muted-foreground">vendido - cancelado</p>
          </CardContent>
        </Card>
      </div>




      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recebimentos por forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.paymentList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.paymentList.map((pay) => {
                const total = summary.productList.reduce(
                  (a, prod) => a + (cell(prod, pay)?.total || 0),
                  0,
                );
                const qty = summary.productList.reduce(
                  (a, prod) => a + (cell(prod, pay)?.qty || 0),
                  0,
                );
                const perc = summary.totalValue ? (total / summary.totalValue) * 100 : 0;
                return (
                  <div key={pay} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{pay}</span>
                      <span className="text-xs text-muted-foreground">{qty} un.</span>
                    </div>
                    <div className="mt-1 text-xl font-bold">{brl(total)}</div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${Math.min(perc, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {perc.toFixed(1)}% do faturamento
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Todas as Vendas</CardTitle>
          <SalesFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            productFilter={productFilter}
            onProductFilterChange={setProductFilter}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            sellerFilter={sellerFilter}
            onSellerFilterChange={setSellerFilter}
            sellerOptions={sellerOptions}
            onClearFilters={clearFilters}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allFiltered.map((sale) => (
                      <TableRow
                        key={sale.id}
                        className={sale.status === "cancelled" ? "opacity-60" : undefined}
                      >
                        <TableCell>{sale.date.toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{sale.time}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {sale.client}
                            {sale.status === "cancelled" && (
                              <Badge variant="destructive" className="text-[10px]">
                                Cancelada
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{sale.seller}</TableCell>
                        <TableCell>{sale.product}</TableCell>
                        <TableCell className="text-center">{sale.quantity}</TableCell>
                        <TableCell>{sale.payment}</TableCell>
                        <TableCell
                          className={`text-right ${
                            sale.status === "cancelled" ? "line-through text-destructive" : ""
                          }`}
                        >
                          {brl(sale.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.status === "delivered" ? (
                            <div className="flex justify-end gap-1">
                              <EditSaleButton
                                saleId={String(sale.id)}
                                client={sale.client}
                                product={sale.product}
                                quantity={sale.quantity}
                                amount={sale.amount}
                                paymentCode={sale.paymentCode}
                              />
                              <CancelSaleButton
                                saleId={String(sale.id)}
                                client={sale.client}
                                product={sale.product}
                                quantity={sale.quantity}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Estornada</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {allFiltered.length === 0 && (
                <div className="py-6 text-center text-muted-foreground">
                  Nenhuma venda encontrada no período.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por produto e forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.productList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    {summary.paymentList.map((p) => (
                      <TableHead key={p} className="text-center">
                        {p}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.productList.map((prod) => {
                    const rowQty = summary.paymentList.reduce(
                      (a, pay) => a + (cell(prod, pay)?.qty || 0),
                      0,
                    );
                    const rowTotal = summary.paymentList.reduce(
                      (a, pay) => a + (cell(prod, pay)?.total || 0),
                      0,
                    );
                    return (
                      <TableRow key={prod}>
                        <TableCell className="font-medium">{prod}</TableCell>
                        {summary.paymentList.map((pay) => {
                          const c = cell(prod, pay);
                          return (
                            <TableCell key={pay} className="text-center">
                              {c ? (
                                <div>
                                  <div className="font-medium">{c.qty} un.</div>
                                  <div className="text-xs text-muted-foreground">{brl(c.total)}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right">
                          <div className="font-medium">{rowQty} un.</div>
                          <div className="text-xs text-muted-foreground">{brl(rowTotal)}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    {summary.paymentList.map((pay) => {
                      const qty = summary.productList.reduce(
                        (a, prod) => a + (cell(prod, pay)?.qty || 0),
                        0,
                      );
                      const total = summary.productList.reduce(
                        (a, prod) => a + (cell(prod, pay)?.total || 0),
                        0,
                      );
                      return (
                        <TableCell key={pay} className="text-center font-semibold">
                          <div>{qty} un.</div>
                          <div className="text-xs text-muted-foreground">{brl(total)}</div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right font-semibold">
                      <div>{summary.totalQty} un.</div>
                      <div className="text-xs text-muted-foreground">{brl(summary.totalValue)}</div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
