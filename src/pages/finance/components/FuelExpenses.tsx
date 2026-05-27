import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NewFuelExpenseForm from "./forms/NewFuelExpenseForm";
import { useDespesas, ORIGEM_DINHEIRO_LABELS, type OrigemDinheiro } from "@/hooks/useDespesas";
import { DateRange } from "react-day-picker";

interface Props { dateRange?: DateRange }

const origemBadgeVariant: Record<OrigemDinheiro, "default" | "secondary" | "outline" | "destructive"> = {
  caixa_portaria: "destructive",
  cofre: "secondary",
  banco: "default",
  pessoal: "outline",
};

export default function FuelExpenses({ dateRange }: Props) {
  const [open, setOpen] = useState(false);
  const { data: despesas = [], isLoading } = useDespesas("combustivel");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Controle de Combustível</CardTitle>
            <CardDescription>Selecione o veículo, informe o valor e a origem do dinheiro</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo Registro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Registro de Combustível</DialogTitle></DialogHeader>
              <NewFuelExpenseForm onSuccess={() => setOpen(false)} />
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
              <TableHead>Valor</TableHead>
              <TableHead>Origem do $</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : despesas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum registro</TableCell></TableRow>
            ) : (
              despesas.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{d.veiculo_placa ?? "-"}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(d.valor).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={origemBadgeVariant[d.origem_dinheiro as OrigemDinheiro] ?? "outline"}>
                      {ORIGEM_DINHEIRO_LABELS[d.origem_dinheiro as OrigemDinheiro]?.split(" (")[0]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.observacoes ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
