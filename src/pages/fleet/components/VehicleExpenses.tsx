
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Car, FileText, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockVehicleExpenses } from "../data/mockData";
import { useToast } from "@/hooks/use-toast";
import NewExpenseForm from "./forms/NewExpenseForm";

export default function VehicleExpenses() {
  const [open, setOpen] = useState(false);
  const [expenses, setExpenses] = useState(mockVehicleExpenses);
  const { toast } = useToast();
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const getExpensesByType = (type) => {
    return expenses.filter(expense => expense.type === type);
  };
  
  const getTotalByType = (type) => {
    return getExpensesByType(type).reduce((total, expense) => total + expense.amount, 0);
  };
  
  const getAllExpenses = () => expenses;
  
  const getTotalExpenses = () => expenses.reduce((total, expense) => total + expense.amount, 0);

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
            <NewExpenseForm 
              onSuccess={() => {
                setOpen(false);
                toast({
                  title: "Despesa registrada",
                  description: "A despesa foi registrada com sucesso."
                });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
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
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="fuel">Combustível</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="tax">Impostos</TabsTrigger>
          <TabsTrigger value="insurance">Seguros</TabsTrigger>
          <TabsTrigger value="other">Outras</TabsTrigger>
        </TabsList>
        
        {["all", "fuel", "maintenance", "tax", "insurance", "other"].map((expenseType) => (
          <TabsContent key={expenseType} value={expenseType}>
            <Card>
              <CardContent className="pt-6">
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
                    {(expenseType === 'all' ? getAllExpenses() : getExpensesByType(expenseType)).map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <span>{expense.vehiclePlate}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.type === 'fuel' ? 'Combustível' : 
                                    expense.type === 'maintenance' ? 'Manutenção' : 
                                    expense.type === 'tax' ? 'Impostos' :
                                    expense.type === 'insurance' ? 'Seguros' : 'Outras'}</TableCell>
                        <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {(expenseType === 'all' ? getAllExpenses() : getExpensesByType(expenseType)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>Não há despesas {expenseType === 'all' ? '' : 'deste tipo'} registradas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
