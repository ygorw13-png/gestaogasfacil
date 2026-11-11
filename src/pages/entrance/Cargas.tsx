import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, ArrowUpFromLine, ArrowDownToLine } from "lucide-react";
import { G1_ACOES } from "@/lib/g1/acoes";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { rotuloProduto, useCargaHistorico, useCargaResumo, type CargaResumoLinha } from "@/hooks/useCarga";
import { SaidaCargaDialog } from "@/components/carga/SaidaCargaDialog";
import { DevolucaoCargaDialog } from "@/components/carga/DevolucaoCargaDialog";
import { CargaHistoricoTabela } from "@/components/carga/CargaHistoricoTabela";

/**
 * Portaria: cargas dos entregadores. Saída avulsa (portaria -> carga), saldo de cada carga,
 * devolução da sobra (carga -> portaria) e histórico. Tudo por ações controladas.
 */
export default function Cargas() {
  const { data: entregadores = [] } = useEntregadoresApp();
  const resumo = useCargaResumo(null);
  const [filtro, setFiltro] = useState<string>("todos");
  const historico = useCargaHistorico(filtro === "todos" ? null : filtro, 7);
  const [saidaPara, setSaidaPara] = useState<string | null | undefined>(undefined);
  const [devolverDe, setDevolverDe] = useState<string | null>(null);

  const porEntregador = useMemo(() => {
    const m = new Map<string, CargaResumoLinha[]>();
    (resumo.data ?? []).forEach((l) => m.set(l.entregador_id, [...(m.get(l.entregador_id) ?? []), l]));
    return m;
  }, [resumo.data]);

  if (!G1_ACOES) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargas dos entregadores</CardTitle>
          <CardDescription>
            Esta tela usa as ações controladas da carga, que ainda não estão ativas neste ambiente.
            Ela passa a funcionar quando o banco receber as migrações G1 e o app for publicado com as ações ligadas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cargas dos entregadores</h1>
          <p className="text-muted-foreground">Saída da portaria para a carga é transferência, não venda. A venda baixa da carga na entrega ou na rua.</p>
        </div>
        <Button onClick={() => setSaidaPara(null)}>
          <ArrowUpFromLine className="mr-2 h-4 w-4" /> Saída para a carga
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Saldo das cargas abertas</CardTitle>
        </CardHeader>
        <CardContent>
          {resumo.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {resumo.isError && <p className="text-sm text-destructive" role="alert">Não foi possível consultar as cargas. Os saldos não são exibidos até a consulta funcionar.</p>}
          {resumo.data && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entregador</TableHead>
                    <TableHead>Na carga</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entregadores.map((e) => {
                    const linhas = porEntregador.get(e.id) ?? [];
                    const temAlgo = linhas.some((l) => l.cheios !== 0 || l.vazios !== 0);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.nome}</TableCell>
                        <TableCell>
                          {linhas.length === 0 ? (
                            <span className="text-muted-foreground">Sem carga aberta</span>
                          ) : (
                            <ul className="space-y-0.5 text-sm">
                              {linhas.map((l) => (
                                <li key={l.produto}>
                                  {rotuloProduto(l.produto)}: <strong>{l.cheios}</strong> cheio(s) · {l.vazios} vazio(s) recolhido(s)
                                </li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSaidaPara(e.id)}>
                              <ArrowUpFromLine className="mr-1 h-3.5 w-3.5" /> Saída
                            </Button>
                            <Button size="sm" variant="outline" disabled={!temAlgo} onClick={() => setDevolverDe(e.id)}>
                              <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> Devolução
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Histórico (últimos 7 dias)</CardTitle>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os entregadores</SelectItem>
              {entregadores.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <CargaHistoricoTabela movimentos={historico.data} isLoading={historico.isLoading} isError={historico.isError} mostrarEntregador={filtro === "todos"} />
        </CardContent>
      </Card>

      <SaidaCargaDialog open={saidaPara !== undefined} onOpenChange={(o) => !o && setSaidaPara(undefined)} entregadorInicial={saidaPara ?? null} />
      <DevolucaoCargaDialog
        open={devolverDe !== null}
        onOpenChange={(o) => !o && setDevolverDe(null)}
        linhas={devolverDe ? porEntregador.get(devolverDe) ?? [] : []}
        quem="pela portaria"
      />
    </div>
  );
}
