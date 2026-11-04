
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDashboardOverview } from "../../hooks/useDashboardData";
import { formatCurrency } from "@/lib/formatUtils";

export function OverviewStats() {
  const { data, isLoading, isError } = useDashboardOverview();

  const renderValue = (value: string) =>
    isLoading ? "Carregando..." : isError ? "Falha ao consultar" : value;

  const variation = data?.variation ?? 0;
  const VariationIcon = variation > 0 ? TrendingUp : variation < 0 ? TrendingDown : Minus;
  const variationColor =
    variation > 0 ? "text-green-600" : variation < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Card className="border-green-100">
        <CardHeader className="p-4 bg-green-50/50">
          <CardTitle className="text-base">Vendas de Hoje</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">
            {renderValue(formatCurrency(data?.todaySalesValue ?? 0))}
          </div>
          {!isLoading && !isError && (
            <div className="flex items-center mt-2">
              <VariationIcon className={`h-4 w-4 mr-1 ${variationColor}`} />
              <p className={`text-xs ${variationColor}`}>
                {variation === 0
                  ? "Sem variação em relação a ontem"
                  : `${Math.abs(variation).toFixed(0)}% ${variation > 0 ? "acima" : "abaixo"} de ontem`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-blue-100">
        <CardHeader className="p-4 bg-blue-50/50">
          <CardTitle className="text-base">Pedidos de Hoje</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">{renderValue(String(data?.ordersToday ?? 0))}</div>
          {!isLoading && !isError && (
            <p className="text-xs text-muted-foreground mt-2">Pedidos registrados hoje (exceto cancelados)</p>
          )}
        </CardContent>
      </Card>
      <Card className="border-purple-100">
        <CardHeader className="p-4 bg-purple-50/50">
          <CardTitle className="text-base">Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold text-muted-foreground">Não disponível</div>
          <p className="text-xs text-muted-foreground mt-2">
            Requer registro de orçamentos ou visitas para comparar com vendas concluídas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
