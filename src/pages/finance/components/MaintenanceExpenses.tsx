import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NewMaintenanceExpenseForm from "./forms/NewMaintenanceExpenseForm";
import { useDespesas, ORIGEM_DINHEIRO_LABELS, type OrigemDinheiro } from "@/hooks/useDespesas";

interface MaintenanceExpensesProps {
  range?: { from?: string; to?: string };
}

export default function MaintenanceExpenses({ range }: MaintenanceExpensesProps) {
  const [open, setOpen] = useState(false);
  const { data: despesas = [], isLoading } = useDespesas("manutencao", range);

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
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Origem do $</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : despesas.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma manutenção no período</TableCell></TableRow>
            ) : (
              despesas.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(`${d.data}T00:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{d.veiculo_placa ?? "-"}</TableCell>
                  <TableCell className="font-medium">{d.descricao}</TableCell>
                  <TableCell>{d.categoria ?? "-"}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(d.valor).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ORIGEM_DINHEIRO_LABELS[d.origem_dinheiro as OrigemDinheiro]?.split(" (")[0] ?? "-"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
