
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { VehicleExpense } from "../../types";
import { formatDate } from "../../utils/formatters";

interface ExpensesTableProps {
  expenses: VehicleExpense[];
  expenseType: string;
}

export default function ExpensesTable({ expenses, expenseType }: ExpensesTableProps) {
  // Filter expenses based on type
  const filteredExpenses = React.useMemo(() => {
    if (expenseType === "all") return expenses;
    return expenses.filter(expense => expense.type === expenseType);
  }, [expenses, expenseType]);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                Nenhuma despesa encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.vehiclePlate}</TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
