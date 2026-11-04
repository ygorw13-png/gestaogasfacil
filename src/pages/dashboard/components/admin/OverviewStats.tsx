
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

  const flow = data?.flow;
  const flowItems = [
    { label: "Vendas concluídas", value: formatCurrency(flow?.concluidas.value ?? 0), hint: `${flow?.concluidas.count ?? 0} vendas` },
    { label: "Pedidos pendentes", value: formatCurrency(flow?.pendentes.value ?? 0), hint: `${flow?.pendentes.count ?? 0} ainda não concluídos` },
    { label: "Recebido hoje", value: formatCurrency((flow?.recebidoNaVenda ?? 0) + (flow?.recebidoDeTitulos ?? 0)), hint: `Vendas ${formatCurrency(flow?.recebidoNaVenda ?? 0)} · títulos ${formatCurrency(flow?.recebidoDeTitulos ?? 0)}` },
    { label: "A receber (fiado)", value: formatCurrency(flow?.aReceber ?? 0), hint: `Vendido a prazo hoje: ${formatCurrency(flow?.vendidoAPrazo ?? 0)}` },
  ];

  return (
    <div className="space-y-4">
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4" aria-label="Fluxo do dia">
      {flowItems.map((i) => (
        <Card key={i.label}>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{i.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-bold">{renderValue(i.value)}</div>
            {!isLoading && !isError && <p className="text-xs text-muted-foreground mt-1">{i.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
    {!isLoading && !isError && (flow?.semFormaRegistrada ?? 0) > 0 && (
      <p className="text-xs text-muted-foreground">
        {formatCurrency(flow!.semFormaRegistrada)} em vendas concluídas sem forma de pagamento registrada não entram em "Recebido".
      </p>
    )}
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Card className="border-green-100">
        <CardHeader className="p-4 bg-green-50/50">
          <CardTitle className="text-base">Pedidos registrados hoje (valor)</CardTitle>
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
    </div>
  );
}
