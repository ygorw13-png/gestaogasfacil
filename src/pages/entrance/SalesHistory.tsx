import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SalesFilters } from "./components/sales/SalesFilters";
import { DateRange } from "react-day-picker";
import { useSalesHistory } from "./hooks/useSalesHistory";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function SalesHistory() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: today, to: today });
  const [productFilter, setProductFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const from = dateRange?.from ?? today;
  const to = dateRange?.to ?? dateRange?.from ?? today;

  const { data: sales = [], isLoading } = useSalesHistory(from, to);

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ from: today, to: today });
    setProductFilter("");
    setPaymentFilter("");
  };

  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const matchesSearch =
          !searchTerm || sale.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProduct = !productFilter || sale.product === productFilter;
        const matchesPayment = !paymentFilter || sale.payment === paymentFilter;
        return matchesSearch && matchesProduct && matchesPayment;
      }),
    [sales, searchTerm, productFilter, paymentFilter],
  );

  const summary = useMemo(() => {
    const products = new Set<string>();
    const payments = new Set<string>();
    const matrix: Record<string, Record<string, { qty: number; total: number }>> = {};

    filteredSales.forEach((s) => {
      products.add(s.product);
      payments.add(s.payment);
      matrix[s.product] = matrix[s.product] || {};
      const cell = matrix[s.product][s.payment] || { qty: 0, total: 0 };
      cell.qty += s.quantity;
      cell.total += s.amount;
      matrix[s.product][s.payment] = cell;
    });

    const productList = Array.from(products).sort();
    const paymentList = Array.from(payments).sort();

    const totalQty = filteredSales.reduce((a, s) => a + s.quantity, 0);
    const totalValue = filteredSales.reduce((a, s) => a + s.amount, 0);

    return { productList, paymentList, matrix, totalQty, totalValue };
  }, [filteredSales]);

  const cell = (p: string, pay: string) => summary.matrix[p]?.[pay];

  return (
    <div className="space-y-6 animate-in pb-20">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/entrance")} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{filteredSales.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Itens vendidos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.totalQty}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{brl(summary.totalValue)}</CardContent>
        </Card>
      </div>

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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.date.toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{sale.time}</TableCell>
                        <TableCell>{sale.client}</TableCell>
                        <TableCell>{sale.product}</TableCell>
                        <TableCell className="text-center">{sale.quantity}</TableCell>
                        <TableCell>{sale.payment}</TableCell>
                        <TableCell className="text-right">{brl(sale.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredSales.length === 0 && (
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
