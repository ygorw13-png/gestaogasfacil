
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StockConfigHeader() {
  return (
    <CardHeader>
      <CardTitle>Configuração de Estoque</CardTitle>
      <CardDescription>
        Configure os níveis mínimos de estoque e alertas
      </CardDescription>
    </CardHeader>
  );
}
