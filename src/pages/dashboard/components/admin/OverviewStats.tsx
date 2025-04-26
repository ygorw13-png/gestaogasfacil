
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Faturamento Total</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">R$ 42.580,00</div>
          <p className="text-xs text-muted-foreground">Último mês</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Média de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">R$ 1.580,00</div>
          <p className="text-xs text-muted-foreground">Por dia</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xl font-bold">87%</div>
          <p className="text-xs text-muted-foreground">+2% desde semana passada</p>
        </CardContent>
      </Card>
    </div>
  );
}
