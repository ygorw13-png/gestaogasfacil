import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSaldosConta } from "@/hooks/useContaBotijoes";
import { PagamentoContaDialog } from "@/components/conta/PagamentoContaDialog";

export function ContaAgregadosTab() {
  const { saldos, isLoading } = useSaldosConta("agregado");
  const [alvo, setAlvo] = useState<{ id: string; nome: string; devidos: number } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (saldos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhum lançamento na conta dos agregados ainda.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agregado</TableHead>
            <TableHead className="text-center">Botijões a acertar</TableHead>
            <TableHead className="text-center">Últimos 30 dias</TableHead>
            <TableHead>Última entrega</TableHead>
            <TableHead className="text-right">Já recebido</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {saldos.map((s) => (
            <TableRow key={s.parceiro_id}>
              <TableCell className="font-medium">{s.parceiro_nome}</TableCell>
              <TableCell className="text-center">
                <Badge variant={s.botijoes_devidos > 0 ? "destructive" : "secondary"}>
                  {s.botijoes_devidos}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{s.entregas_30d}</TableCell>
              <TableCell>
                {s.ultima_entrega
                  ? new Date(s.ultima_entrega + "T00:00:00").toLocaleDateString("pt-BR")
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                {s.valor_recebido.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  disabled={s.botijoes_devidos <= 0}
                  onClick={() =>
                    setAlvo({
                      id: s.parceiro_id,
                      nome: s.parceiro_nome,
                      devidos: s.botijoes_devidos,
                    })
                  }
                >
                  Receber
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PagamentoContaDialog
        open={!!alvo}
        onOpenChange={(o) => !o && setAlvo(null)}
        parceiroTipo="agregado"
        parceiroId={alvo?.id ?? ""}
        parceiroNome={alvo?.nome ?? ""}
        botijoesDevidos={alvo?.devidos ?? 0}
      />
    </>
  );
}
