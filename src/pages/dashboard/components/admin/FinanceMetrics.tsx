
import { DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function FinanceMetrics() {
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base">Métricas Financeiras</CardTitle>
        <CardDescription>Resumo do desempenho financeiro</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Receita Bruta</span>
            </div>
            <span className="text-sm font-medium text-green-600">R$ 158.450,00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span>Lucro Líquido</span>
            </div>
            <span className="text-sm font-medium text-blue-600">R$ 42.580,00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
