
import { DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatUtils";

/** Receita bruta do mês corrente: pedidos não cancelados, price × quantity. */
function useMonthlyRevenue() {
  return useQuery({
    queryKey: ["admin", "monthly-revenue"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data, error } = await supabase
        .from("orders")
        .select("price, quantity, status")
        .gte("created_at", monthStart.toISOString());
      if (error) throw error;
      return (data || [])
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.price || 0) * Number(o.quantity || 1), 0);
    },
    refetchInterval: 60_000,
  });
}

export function FinanceMetrics() {
  const { data: revenue, isLoading, isError } = useMonthlyRevenue();

  return (
    <Card className="border-blue-100">
      <CardHeader className="p-4 bg-blue-50/50">
        <CardTitle className="text-base">Métricas Financeiras</CardTitle>
        <CardDescription>Resumo do desempenho financeiro do mês corrente</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Receita Bruta (mês)</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              {isLoading ? "Carregando..." : isError ? "Falha ao consultar" : formatCurrency(revenue ?? 0)}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span>Lucro Líquido</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">Não disponível</span>
          </div>
          <p className="text-xs text-muted-foreground px-2">
            O lucro exige o registro de custos de compra e despesas. Esse módulo ainda não existe no sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
