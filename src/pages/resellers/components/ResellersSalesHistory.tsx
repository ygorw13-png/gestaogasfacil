import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useResellerSales } from "../hooks/useResellers";

interface ResellersSalesHistoryProps {
  canViewPrices: boolean;
}

export function ResellersSalesHistory({ canViewPrices }: ResellersSalesHistoryProps) {
  const { data: sales = [], isLoading } = useResellerSales();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sales.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>Nenhuma venda para agregados registrada.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Agregado</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              {canViewPrices && (
                <>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const unit = sale.quantity > 0 ? sale.price / sale.quantity : sale.price;
              return (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.date), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="font-medium">{sale.resellerName}</TableCell>
                  <TableCell>{sale.product ?? "-"}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  {canViewPrices && (
                    <>
                      <TableCell className="text-right">R$ {unit.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">R$ {sale.price.toFixed(2)}</TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
