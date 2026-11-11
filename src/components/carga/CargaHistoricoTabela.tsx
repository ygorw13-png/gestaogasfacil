import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROTULO_MOVIMENTO, rotuloProduto, type CargaMovimento } from "@/hooks/useCarga";
import { FUSO_OPERACIONAL } from "@/lib/dataOperacional";

const quando = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_OPERACIONAL, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const sinal = (n: number) => (n > 0 ? `+${n}` : String(n));

interface Props {
  movimentos: CargaMovimento[] | undefined;
  isLoading: boolean;
  isError: boolean;
  mostrarEntregador?: boolean;
}

/** Histórico da carga. Falha de consulta aparece como erro, nunca como lista vazia. */
export function CargaHistoricoTabela({ movimentos, isLoading, isError, mostrarEntregador }: Props) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando histórico…</p>;
  if (isError) return <p className="text-sm text-destructive" role="alert">Não foi possível carregar o histórico da carga.</p>;
  if (!movimentos || movimentos.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma movimentação no período.</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quando</TableHead>
            {mostrarEntregador && <TableHead>Entregador</TableHead>}
            <TableHead>Movimento</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Cheios</TableHead>
            <TableHead className="text-right">Vazios</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Registrado por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimentos.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="whitespace-nowrap">{quando(m.criado_em)}</TableCell>
              {mostrarEntregador && <TableCell>{m.entregador_nome}</TableCell>}
              <TableCell><Badge variant="outline">{ROTULO_MOVIMENTO[m.tipo] ?? m.tipo}</Badge></TableCell>
              <TableCell>{rotuloProduto(m.produto)}</TableCell>
              <TableCell className="text-right tabular-nums">{sinal(m.delta_cheios)}</TableCell>
              <TableCell className="text-right tabular-nums">{sinal(m.delta_vazios)}</TableCell>
              <TableCell>{m.cliente ?? "—"}</TableCell>
              <TableCell>{m.registrado_por_nome}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
