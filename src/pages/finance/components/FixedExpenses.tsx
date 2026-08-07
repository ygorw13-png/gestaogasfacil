
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, BellRing, FilePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import NewFixedExpenseForm from "./forms/NewFixedExpenseForm";
import LembretesTab from "./LembretesTab";

interface FixedExpensesProps {
  dateRange?: DateRange;
}

export default function FixedExpenses({ dateRange }: FixedExpensesProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tabs defaultValue="despesas" className="w-full space-y-4">
      <TabsList>
        <TabsTrigger value="despesas" className="flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Despesas Fixas
        </TabsTrigger>
        <TabsTrigger value="lembretes" className="flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          Lembretes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="lembretes">
        <LembretesTab />
      </TabsContent>

      <TabsContent value="despesas">

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Despesas Fixas</CardTitle>
            <CardDescription>
              Gerencie despesas recorrentes como aluguel, serviços e assinaturas
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa Fixa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Despesa Fixa</DialogTitle>
              </DialogHeader>
              <NewFixedExpenseForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Dia de Vencimento</TableHead>
              <TableHead>Último Pagamento</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Dados serão preenchidos aqui */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
