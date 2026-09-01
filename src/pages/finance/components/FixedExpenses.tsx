
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
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Origem do $</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : despesas.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma despesa fixa no período</TableCell></TableRow>
            ) : (
              despesas.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(`${d.data}T00:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{d.descricao}</TableCell>
                  <TableCell>{d.categoria ?? "-"}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(d.valor).toFixed(2)}</TableCell>
                  <TableCell>{ORIGEM_DINHEIRO_LABELS[d.origem_dinheiro as OrigemDinheiro]?.split(" (")[0] ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.observacoes ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

    </Card>
      </TabsContent>
    </Tabs>
  );
}

