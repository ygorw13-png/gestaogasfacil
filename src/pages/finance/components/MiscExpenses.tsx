import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DateRange } from "react-day-picker";
import NewMiscExpenseForm from "./forms/NewMiscExpenseForm";
import { useDespesas, ORIGEM_DINHEIRO_LABELS, type OrigemDinheiro } from "@/hooks/useDespesas";

interface Props { dateRange?: DateRange }

const origemBadgeVariant: Record<OrigemDinheiro, "default" | "secondary" | "outline" | "destructive"> = {
  caixa_portaria: "destructive",
  cofre: "secondary",
  banco: "default",
  pessoal: "outline",
  promissoria_estabelecimento: "secondary",
};

export default function MiscExpenses({ dateRange }: Props) {
  const [open, setOpen] = useState(false);
  const { data: despesas = [], isLoading } = useDespesas("diversa");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Despesas Diversas</CardTitle>
            <CardDescription>Material, alimentação, etc. — sempre informe a origem do dinheiro.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Despesa Diversa</DialogTitle></DialogHeader>
              <NewMiscExpenseForm onSuccess={() => setOpen(false)} />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
            ) : despesas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma despesa</TableCell></TableRow>
            ) : (
              despesas.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{d.descricao}</TableCell>
                  <TableCell>{d.categoria ?? "-"}</TableCell>
                  <TableCell className="font-semibold">R$ {Number(d.valor).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={origemBadgeVariant[d.origem_dinheiro as OrigemDinheiro] ?? "outline"}>
                      {ORIGEM_DINHEIRO_LABELS[d.origem_dinheiro as OrigemDinheiro]?.split(" (")[0]}
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
