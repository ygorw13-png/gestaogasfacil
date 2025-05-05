
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import NewMaintenanceExpenseForm from "./forms/NewMaintenanceExpenseForm";

interface MaintenanceExpensesProps {
  dateRange?: DateRange;
}

export default function MaintenanceExpenses({ dateRange }: MaintenanceExpensesProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Despesas de Manutenção</CardTitle>
            <CardDescription>
              Gerencie despesas de manutenção de veículos e equipamentos
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nova Despesa de Manutenção</DialogTitle>
              </DialogHeader>
              <NewMaintenanceExpenseForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prestador</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Nota/Comprovante</TableHead>
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
