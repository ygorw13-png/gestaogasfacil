
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResellersSalesHistoryProps {
  canViewPrices: boolean;
}

export function ResellersSalesHistory({ canViewPrices }: ResellersSalesHistoryProps) {
  // This would be populated from real data in a production environment
  const sales: any[] = [];

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
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                {/* Sale data would be rendered here */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
