
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Droplet } from "lucide-react";

interface StatisticsCardsProps {
  totalSales: number;
  glpSales: {
    p13: number;
    p20: number;
    p45: number;
  };
  waterSales: number;
}

export function StatisticsCards({ totalSales, glpSales, waterSales }: StatisticsCardsProps) {
  const totalGlpUnits = glpSales.p13 + glpSales.p20 + glpSales.p45;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vendas Hoje</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {totalSales.toFixed(2).replace('.', ',')}</div>
          <p className="text-xs text-muted-foreground">
            +12% desde ontem
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas de GLP</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalGlpUnits} unidades</div>
          <p className="text-xs text-muted-foreground">
            {glpSales.p13} P13 | {glpSales.p20} P20 | {glpSales.p45} P45
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas de Água</CardTitle>
          <Droplet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{waterSales} galões</div>
          <p className="text-xs text-muted-foreground">
            Média de 3 galões/hora
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
