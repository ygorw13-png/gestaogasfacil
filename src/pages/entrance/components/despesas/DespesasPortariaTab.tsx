import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Bike } from "lucide-react";
import { useDespesas } from "@/hooks/useDespesas";
import { DespesaPortariaDialog } from "./DespesaPortariaDialog";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DespesasPortariaTab() {
  const { data: despesas, isLoading } = useDespesas();
  const [open, setOpen] = useState(false);

  const hoje = new Date().toISOString().slice(0, 10);
  const doDia = (despesas ?? []).filter((d) => d.data === hoje);
  const total = doDia.reduce((s, d) => s + Number(d.valor ?? 0), 0);

  const porColaborador = doDia.reduce<Record<string, number>>((acc, d) => {
    const nome = d.colaborador_nome || "Sem responsável";
    acc[nome] = (acc[nome] ?? 0) + Number(d.valor ?? 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Despesas do dia</h2>
          <p className="text-sm text-muted-foreground">
            Gasolina, manutenção e gastos avulsos — atribuídos ao vendedor e à moto dele.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Lançar despesa
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total gasto hoje</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{brl(total)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Por vendedor</CardTitle>
            <CardDescription>Cada moto tem seu próprio acumulado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.keys(porColaborador).length === 0 ? (
              <p className="text-muted-foreground">Nenhuma despesa hoje.</p>
            ) : (
              Object.entries(porColaborador).map(([nome, v]) => (
                <div key={nome} className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Bike className="h-3 w-3" /> {nome}
                  </span>
                  <span className="font-medium">{brl(v)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2 text-left">Descrição</th>
                <th className="p-2 text-left">Vendedor</th>
                <th className="p-2 text-left">Moto</th>
                <th className="p-2 text-left">Origem</th>
                <th className="p-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {doDia.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Nenhuma despesa lançada hoje.
                  </td>
                </tr>
              )}
              {doDia.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2">{d.descricao}</td>
                  <td className="p-2">{d.colaborador_nome || "—"}</td>
                  <td className="p-2">{d.veiculo_placa || "—"}</td>
                  <td className="p-2">
                    {d.origem_dinheiro === "caixa_portaria" ? (
                      <Badge variant="secondary">Sangria da portaria</Badge>
                    ) : (
                      <span className="text-muted-foreground">{d.origem_dinheiro}</span>
                    )}
                  </td>
                  <td className="p-2 text-right font-medium">{brl(Number(d.valor ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DespesaPortariaDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
