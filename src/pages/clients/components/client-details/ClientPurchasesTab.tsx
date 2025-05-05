
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { useClientPurchases } from "../../hooks/useClientPurchases";

export function ClientPurchasesTab() {
  const { purchases, formatDate, formatCurrency } = useClientPurchases();

  return (
    <>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Histórico de Compras</h3>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Clock size={16} />
          <span>Ver Todas</span>
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Pagamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                Nenhuma compra registrada
              </TableCell>
            </TableRow>
          ) : (
            purchases.map(purchase => (
              <TableRow key={purchase.id}>
                <TableCell>{formatDate(purchase.date)}</TableCell>
                <TableCell>{purchase.product}</TableCell>
                <TableCell>{purchase.quantity}</TableCell>
                <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                <TableCell>{purchase.paymentMethod}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}
