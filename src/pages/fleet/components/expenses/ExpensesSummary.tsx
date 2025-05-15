
import { Card, CardContent } from "@/components/ui/card";
import { VehicleExpense } from "../../types";

interface ExpensesSummaryProps {
  expenses: VehicleExpense[];
}

export default function ExpensesSummary({ expenses }: ExpensesSummaryProps) {
  const getTotalByType = (type: string) => {
    return expenses
      .filter(expense => expense.type === type)
      .reduce((total, expense) => total + expense.amount, 0);
  };
  
  const getTotalExpenses = () => expenses.reduce((total, expense) => total + expense.amount, 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total de Despesas</p>
            <p className="text-2xl font-bold">R$ {getTotalExpenses().toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Combustível</p>
            <p className="text-2xl font-bold">R$ {getTotalByType('fuel').toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Manutenção</p>
            <p className="text-2xl font-bold">R$ {getTotalByType('maintenance').toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Outros</p>
            <p className="text-2xl font-bold">R$ {(getTotalByType('tax') + getTotalByType('insurance') + getTotalByType('other')).toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
