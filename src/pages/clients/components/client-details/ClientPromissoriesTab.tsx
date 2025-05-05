
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { FilePlus } from "lucide-react";
import { useClientPromissories } from "../../hooks/useClientPromissories";

export function ClientPromissoriesTab() {
  const { promissories, formatDate, formatCurrency, getStatusBadgeColor } = useClientPromissories();

  return (
    <>
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Notas Promissórias</h3>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FilePlus size={16} />
          <span>Nova Promissória</span>
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promissories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                Nenhuma promissória registrada
              </TableCell>
            </TableRow>
          ) : (
            promissories.map(promissory => (
              <TableRow key={promissory.id}>
                <TableCell>{formatDate(promissory.dueDate)}</TableCell>
                <TableCell>{formatCurrency(promissory.amount)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span 
                      className={`h-2 w-2 rounded-full mr-2 ${getStatusBadgeColor(promissory.status)}`} 
                    />
                    {promissory.status === "pending" && "Pendente"}
                    {promissory.status === "paid" && "Paga"}
                    {promissory.status === "overdue" && "Vencida"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Detalhes</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}
