
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function OverviewStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Card className="border-green-100">
        <CardHeader className="p-4 bg-green-50/50">
          <CardTitle className="text-base">Faturamento Total</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">R$ 42.580,00</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <p className="text-xs text-green-600">5% acima do último mês</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-blue-100">
        <CardHeader className="p-4 bg-blue-50/50">
          <CardTitle className="text-base">Média de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">R$ 1.580,00</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <p className="text-xs text-green-600">3% acima da média diária</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-purple-100">
        <CardHeader className="p-4 bg-purple-50/50">
          <CardTitle className="text-base">Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">87%</div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <p className="text-xs text-green-600">+2% desde semana passada</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
