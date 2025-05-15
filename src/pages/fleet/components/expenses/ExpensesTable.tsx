
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Car, FileText, DollarSign } from "lucide-react";
import { VehicleExpense } from "../../types";
import { formatDate } from "../../utils/formatters";

interface ExpensesTableProps {
  expenses: VehicleExpense[];
  expenseType: string;
}

export default function ExpensesTable({ expenses, expenseType }: ExpensesTableProps) {
  const getExpensesByType = () => {
    if (expenseType === 'all') {
      return expenses;
    }
    return expenses.filter(expense => expense.type === expenseType);
  };
  
  const filteredExpenses = getExpensesByType();
  
  const getExpenseTypeLabel = (type: string): string => {
    switch(type) {
      case 'fuel': return 'Combustível';
      case 'maintenance': return 'Manutenção';
      case 'tax': return 'Impostos';
      case 'insurance': return 'Seguros';
      default: return 'Outras';
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{expense.vehiclePlate}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{getExpenseTypeLabel(expense.type)}</TableCell>
                <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Não há despesas {expenseType === 'all' ? '' : 'deste tipo'} registradas.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
