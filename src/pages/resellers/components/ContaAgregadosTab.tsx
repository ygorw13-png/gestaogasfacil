import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSaldosConta } from "@/hooks/useContaBotijoes";
import type { Reseller } from "../types";
import { useResumoAgregados } from "../hooks/useAgregadoConta";

/** Quantidades por agregado (sem valores). Acerto e valores ficam na ficha, só para o administrador. */
export function ContaAgregadosTab({ resellers, onAbrir }: { resellers: Reseller[]; onAbrir: (r: Reseller) => void }) {
  const { data: resumo, isLoading } = useResumoAgregados(resellers.map((r) => r.id));
  const { saldos: antigos } = useSaldosConta("agregado");

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }
  if (resellers.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum agregado cadastrado.</p>;
  }
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agregado</TableHead>
            <TableHead className="text-center">Retirados</TableHead>
            <TableHead className="text-center">Devolvidos</TableHead>
            <TableHead className="text-center">Acertados</TableHead>
            <TableHead className="text-center">Ainda não acertados</TableHead>
            <TableHead className="text-right">Ficha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resellers.map((r) => {
            const q = resumo?.[r.id];
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-center">{q?.retirada ?? 0}</TableCell>
                <TableCell className="text-center">{q?.devolvida ?? 0}</TableCell>
                <TableCell className="text-center">{q?.acertada ?? 0}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={(q?.pendente ?? 0) > 0 ? "destructive" : "secondary"}>{q?.pendente ?? 0}</Badge>
                </TableCell>
                <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => onAbrir(r)}>Abrir</Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {antigos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Conta anterior (sem valor, fora do acerto novo):{" "}
          {antigos.map((s) => `${s.parceiro_nome}: ${s.botijoes_devidos}`).join(" · ")} botijões.
        </p>
      )}
    </div>
  );
}
