import { TrendingUp, TrendingDown, Package, Droplet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatUtils";

export interface OverviewData {
  todaySalesValue: number;
  variation: number;
  ordersToday: number;
  stock: {
    gasP13: number;
    gasP20: number;
    gasP45: number;
    water: number;
    vaziosP13: number;
    vaziosAgua: number;
    emprestadosP13: number;
  };
  promissoryNotes: number;
  promissoryValue: number;
  promissoryOverdue: number;
}

interface OverviewCardsProps {
  data: OverviewData;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const positive = data.variation >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas de Hoje</CardTitle>
          <TrendIcon className={`h-4 w-4 ${positive ? "text-primary" : "text-destructive"}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.todaySalesValue)}</div>
          <p className="text-xs text-muted-foreground">
            {data.ordersToday} vendas · {positive ? "+" : ""}
            {data.variation.toFixed(1)}% vs. ontem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque GLP (P13)</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stock.gasP13} cheios</div>
          <p className="text-xs text-muted-foreground">
            {data.stock.vaziosP13} vazios · {data.stock.emprestadosP13} emprestados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Água</CardTitle>
          <Droplet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stock.water} galões</div>
          <p className="text-xs text-muted-foreground">{data.stock.vaziosAgua} vazios na portaria</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promissórias</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.promissoryNotes}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(data.promissoryValue)} · {data.promissoryOverdue} vencidas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
