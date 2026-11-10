
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

  const p = data?.painel;
  const rec = p?.recebido;
  const div = p?.divergencias;
  const nDiv = (div?.valor ?? 0) + (div?.semComprovacao ?? 0) + (div?.semForma ?? 0);
  const flowItems = [
    { label: "Vendas concluídas", value: formatCurrency(p?.concluidas.value ?? 0), hint: `${p?.concluidas.count ?? 0} vendas hoje` },
    rec
      ? { label: "Recebido hoje", value: formatCurrency(rec.total), hint: `Conferido ${formatCurrency(rec.conferido)} · com entregador, aguardando acerto ${formatCurrency(rec.aguardandoAcerto)} · títulos ${formatCurrency(rec.deTitulos)}` }
      : { label: "Recebido hoje", value: "Não comprovado", hint: `Sem registro de recebimento. Forma informada nas vendas: ${formatCurrency(p?.formaInformada ?? 0)} (não é prova de pagamento)` },
    { label: "Saldo a receber", value: formatCurrency(p?.aReceber ?? 0), hint: "Promissórias em aberto (saldo restante)" },
    { label: "Saldo vencido", value: formatCurrency(p?.vencido.value ?? 0), hint: `${p?.vencido.count ?? 0} promissórias vencidas` },
    {
      label: "Divergências",
      value: String(nDiv),
      hint: [
        div?.valor == null ? "valor recebido: sem registro" : `${div.valor} com valor diferente (${formatCurrency(div.diferenca)})`,
        div?.semComprovacao == null ? null : `${div.semComprovacao} concluídas sem recebimento nem promissória`,
        `${div?.semForma ?? 0} sem forma de pagamento`,
      ].filter(Boolean).join(" · "),
    },
  ];

  return (
    <div className="space-y-4">
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5" aria-label="Fluxo do dia">
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
