import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, PackagePlus, RefreshCw, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstoqueGeral } from "../../hooks/useEstoqueGeral";
import { MovimentoPatioDialog } from "./MovimentoPatioDialog";
import { exportToCsv } from "@/utils/csvExport";
import type { MinStockLevels } from "../stock/StockData";

interface Props {
  minStock: MinStockLevels;
}

const minKey: Record<string, keyof MinStockLevels> = {
  P13: "p13",
  P20: "p20",
  P45: "p45",
  agua: "water",
};

export function EstoqueGeralPanel({ minStock }: Props) {
  const { linhas, isLoading, refetch } = useEstoqueGeral();
  const [dialog, setDialog] = useState<null | "entrada" | "ajuste">(null);

  const totalCheios = linhas.reduce((s, l) => s + l.total_cheios, 0);
  const totalVazios = linhas.reduce((s, l) => s + l.total_vazios, 0);
  const totalEmprestados = linhas.reduce((s, l) => s + l.emprestados, 0);
  const totalPatio = linhas.reduce((s, l) => s + l.patio_cheios, 0);

  const handleExport = () => {
    exportToCsv(
      `estoque-geral-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Produto", accessor: (r: any) => r.label },
        { header: "Cheios (pátio)", accessor: (r: any) => r.patio_cheios },
        { header: "Vasilhames (pátio)", accessor: (r: any) => r.patio_vazios },
        { header: "Cheios (portaria)", accessor: (r: any) => r.portaria_cheios },
        { header: "Vasilhames (portaria)", accessor: (r: any) => r.portaria_vazios },
        { header: "Emprestados", accessor: (r: any) => r.emprestados },
        { header: "Total cheios", accessor: (r: any) => r.total_cheios },
        { header: "Total vasilhames", accessor: (r: any) => r.total_vazios },
      ],
      linhas as any
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Estoque Geral</h2>
          <p className="text-xs text-muted-foreground">
            Calculado pelas movimentações reais: entradas no pátio, transferências para a portaria,
            vendas e devoluções de vasilhame.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setDialog("entrada")}>
            <PackagePlus className="h-4 w-4 mr-2" />
            Entrada no pátio
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialog("ajuste")}>
            <Wrench className="h-4 w-4 mr-2" />
            Corrigir estoque
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Resumo label="Cheios (total)" value={totalCheios} tone="primary" />
          <Resumo label="Vasilhames (total)" value={totalVazios} />
          <Resumo label="Cheios no pátio" value={totalPatio} />
          <Resumo label="Emprestados (comodato)" value={totalEmprestados} tone="warning" />
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Cheios pátio</TableHead>
                <TableHead className="text-right">Vasilhames pátio</TableHead>
                <TableHead className="text-right">Cheios portaria</TableHead>
                <TableHead className="text-right">Vasilhames portaria</TableHead>
                <TableHead className="text-right">Total cheios</TableHead>
                <TableHead className="text-right">Total vasilhames</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-24 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                linhas.map((l) => {
                  const min = minStock[minKey[l.produto]] ?? 0;
                  const baixo = l.total_cheios < min;
                  return (
                    <TableRow key={l.produto}>
                      <TableCell className="font-medium">{l.label}</TableCell>
                      <TableCell className="text-right">{l.patio_cheios}</TableCell>
                      <TableCell className="text-right">{l.patio_vazios}</TableCell>
                      <TableCell className="text-right">{l.portaria_cheios}</TableCell>
                      <TableCell className="text-right">{l.portaria_vazios}</TableCell>
                      <TableCell className="text-right font-semibold">{l.total_cheios}</TableCell>
                      <TableCell className="text-right font-semibold">{l.total_vazios}</TableCell>
                      <TableCell>
                        <Badge variant={baixo ? "destructive" : "secondary"}>
                          {baixo ? `Abaixo do mínimo (${min})` : "Disponível"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MovimentoPatioDialog
        open={dialog !== null}
        modo={dialog ?? "entrada"}
        onOpenChange={(o) => !o && setDialog(null)}
        linhas={linhas}
        onDone={() => refetch()}
      />
    </div>
  );
}

function Resumo({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "primary" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={`text-2xl font-bold ${
            tone === "primary"
              ? "text-primary"
              : tone === "warning"
              ? "text-amber-600 dark:text-amber-400"
              : ""
          }`}
        >
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
