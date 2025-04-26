
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export function FinanceMetrics() {
  return (
    <Card className="border-blue-100">
      <CardHeader className="p-4 bg-blue-50/50">
        <CardTitle className="text-base">Métricas Financeiras</CardTitle>
        <CardDescription>Resumo do desempenho financeiro</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Receita Bruta</span>
            </div>
            <span className="text-sm font-medium text-green-600">R$ 158.450,00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span>Lucro Líquido</span>
            </div>
            <span className="text-sm font-medium text-blue-600">R$ 42.580,00</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <button className="flex items-center text-sm text-blue-500 hover:text-blue-700 transition-colors">
          Ver relatório completo
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </CardFooter>
    </Card>
  );
}
