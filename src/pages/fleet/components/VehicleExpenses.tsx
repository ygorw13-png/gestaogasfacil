
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import NewExpenseForm from "./forms/NewExpenseForm";
import ExpensesSummary from "./expenses/ExpensesSummary";
import ExpensesTable from "./expenses/ExpensesTable";
import { useFleet } from "../context/FleetContext";

export default function VehicleExpenses() {
  const [open, setOpen] = useState(false);
  const { expenses, addExpense } = useFleet();
  
  const handleExpenseSuccess = () => {
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Despesas da Frota</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
            </DialogHeader>
            <NewExpenseForm onSuccess={handleExpenseSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      
      <ExpensesSummary expenses={expenses} />
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="fuel">Combustível</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="tax">Impostos</TabsTrigger>
          <TabsTrigger value="insurance">Seguros</TabsTrigger>
          <TabsTrigger value="other">Outras</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <ExpensesTable expenses={expenses} expenseType="all" />
            </CardContent>
          </Card>
        </TabsContent>
        
        {["fuel", "maintenance", "tax", "insurance", "other"].map((expenseType) => (
          <TabsContent key={expenseType} value={expenseType}>
            <Card>
              <CardContent className="pt-6">
                <ExpensesTable expenses={expenses} expenseType={expenseType} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
