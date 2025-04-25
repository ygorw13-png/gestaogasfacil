
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Seller {
  id: number;
  name: string;
  sales: number;
  value: string;
}

interface TopSellersProps {
  sellers: Seller[];
}

export function TopSellers({ sellers }: TopSellersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Vendedores</CardTitle>
        <CardDescription>
          Vendedores com melhor desempenho no período atual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sellers.map((seller) => (
            <div key={seller.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div className="flex items-center gap-4">
                <div className="bg-gasflow-100 text-gasflow-700 w-9 h-9 rounded-full flex items-center justify-center">
                  {seller.id}
                </div>
                <div>
                  <p className="font-medium">{seller.name}</p>
                  <p className="text-sm text-muted-foreground">{seller.sales} vendas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{seller.value}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
