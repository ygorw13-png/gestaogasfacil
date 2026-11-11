import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { G1_ACOES } from "@/lib/g1/acoes";
import { useUserRole } from "@/hooks/useUserRole";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import {
  useItensConferencia, useReembolsos, useReversoes, type ItemConferencia, type ReversaoComPedido,
} from "@/hooks/useReversoes";
import { ConfirmarFisicoDialog, type CargaAberta } from "@/components/reversao/ConfirmarFisicoDialog";
import { ConferenciaDialog, DecidirDialog, ReembolsoDialog } from "./components/ReversaoDialogs";
import { ORIGEM_ROTULO, brl, quando, FORMA_ROTULO } from "./components/formato";
import {
  CONDICAO_ROTULO, STATUS_ROTULO, TIPO_ROTULO, efeitosTexto, pendenciasFisicas, resumoReversoes, type ReembolsoLinha,
} from "@/lib/g1/reversao";

const ATIVAS = new Set(["solicitada", "aguardando_retorno", "reembolso_pendente"]);

function corStatus(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "solicitada") return "default";
  if (s === "concluida") return "secondary";
  if (s === "recusada") return "destructive";
  return "outline";
}

export default function Reversoes() {
  const { isAdmin } = useUserRole();
  const reversoes = useReversoes();
  const reembolsos = useReembolsos();
  const conferencia = useItensConferencia();
  const { data: entregadores = [] } = useEntregadoresApp();
  const cargas = useQuery({
    queryKey: ["reversoes", "cargas-abertas"],
    enabled: G1_ACOES,
    queryFn: async () => {
      const { data, error } = await supabase.from("cargas").select("id, entregador_id").eq("status", "aberta");
      if (error) throw error;
      return data ?? [];
    },
  });
  const cargasAbertas: CargaAberta[] = useMemo(() => (cargas.data ?? []).map((c) => ({
    id: c.id, nome: entregadores.find((e) => e.id === c.entregador_id)?.nome ?? "entregador",
  })), [cargas.data, entregadores]);

  const [decidir, setDecidir] = useState<ReversaoComPedido | null>(null);
  const [fisico, setFisico] = useState<ReversaoComPedido | null>(null);
  const [reembolso, setReembolso] = useState<ReembolsoLinha | null>(null);
  const [conferir, setConferir] = useState<ItemConferencia | null>(null);

  const lista = useMemo(() => reversoes.data ?? [], [reversoes.data]);
  const porId = useMemo(() => new Map(lista.map((r) => [r.id, r])), [lista]);

  if (!G1_ACOES) return <div className="p-4 text-sm text-muted-foreground">As reversões controladas não estão ativas.</div>;

  const resumo = resumoReversoes(lista, reembolsos.data ?? []);
  const ativas = lista.filter((r) => ATIVAS.has(r.status));
  const encerradas = lista.filter((r) => !ATIVAS.has(r.status));
  const pendentesReemb = (reembolsos.data ?? []).filter((e) => e.status === "pendente");
  const realizados = (reembolsos.data ?? []).filter((e) => e.status === "realizado");
  const emConferencia = (conferencia.data ?? []).filter((i) => i.status === "em_conferencia");
  const erroConsulta = reversoes.isError || reembolsos.isError;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reversões e Reembolsos</h1>
        <p className="text-sm text-muted-foreground">
          Cancelamentos, devoluções, trocas e lançamentos duplicados. A venda original fica no histórico; cada passo (autorização, retorno do produto, reembolso) é registrado à parte.
        </p>
      </div>

      {erroConsulta && <p className="text-sm text-destructive" role="alert">Não foi possível consultar as reversões agora. Os valores não são exibidos até a consulta funcionar.</p>}

      {!erroConsulta && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-1"><CardDescription>Aguardando autorização</CardDescription><CardTitle className="text-2xl">{resumo.aguardandoAutorizacao}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-1"><CardDescription>Vendas revertidas (60 dias)</CardDescription><CardTitle className="text-2xl">{resumo.vendasRevertidas} · {brl(resumo.valorVendasRevertidas)}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-1"><CardDescription>A reembolsar (pendente)</CardDescription><CardTitle className="text-2xl">{brl(resumo.reembolsoPendente)}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-1"><CardDescription>Reembolsado (confirmado)</CardDescription><CardTitle className="text-2xl">{brl(resumo.reembolsado)}</CardTitle></CardHeader></Card>
        </div>
      )}

      <Tabs defaultValue="andamento">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="andamento">Em andamento ({ativas.length})</TabsTrigger>
          <TabsTrigger value="reembolsos">Reembolsos ({pendentesReemb.length})</TabsTrigger>
          <TabsTrigger value="conferencia">Conferência ({emConferencia.length})</TabsTrigger>
          <TabsTrigger value="historico">Encerradas</TabsTrigger>
        </TabsList>

        <TabsContent value="andamento" className="space-y-3">
          {reversoes.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {reversoes.data && ativas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma reversão em andamento.</p>}
          {ativas.map((r) => (
            <ReversaoCard key={r.id} r={r} acoes={
              <>
                {r.status === "solicitada" && isAdmin && <Button size="sm" onClick={() => setDecidir(r)}>Autorizar ou recusar</Button>}
                {r.status === "solicitada" && !isAdmin && <span className="text-xs text-muted-foreground">Aguardando o administrador.</span>}
                {r.status === "aguardando_retorno" && <Button size="sm" variant="outline" onClick={() => setFisico(r)}>Confirmar retorno físico</Button>}
              </>
            } />
          ))}
        </TabsContent>

        <TabsContent value="reembolsos" className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-base">Reembolsos pendentes</CardTitle>
              <CardDescription>Só conta como devolvido depois de registrado. PIX e cartão: saem da conta da empresa, com referência ou comprovante.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {pendentesReemb.length === 0 && <p className="text-sm text-muted-foreground">Nenhum reembolso pendente.</p>}
              {pendentesReemb.map((e) => {
                const r = porId.get(e.reversao_id);
                return (
                  <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                    <div>
                      <div className="font-medium">{brl(e.valor)} · {FORMA_ROTULO[e.forma] ?? e.forma}</div>
                      <div className="text-xs text-muted-foreground">
                        {r?.pedido?.client_name ?? "Cliente"} · {r ? TIPO_ROTULO[r.tipo] : ""} · desde {quando(e.criado_em)}
                        {e.acerto_original_id ? " · dinheiro já acertado" : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setReembolso(e)}>Registrar reembolso feito</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Reembolsos realizados</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {realizados.length === 0 && <p className="text-sm text-muted-foreground">Nenhum reembolso realizado no período.</p>}
              {realizados.map((e) => (
                <div key={e.id} className="rounded-md border p-2 text-sm">
                  <div className="font-medium">{brl(e.valor)} · {FORMA_ROTULO[e.forma] ?? e.forma} · saiu de: {ORIGEM_ROTULO[e.origem ?? ""] ?? e.origem}</div>
                  <div className="text-xs text-muted-foreground">
                    {porId.get(e.reversao_id)?.pedido?.client_name ?? "Cliente"} · {e.realizado_por_nome ?? "—"} · {quando(e.realizado_em)}{e.referencia ? ` · ref. ${e.referencia}` : ""}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conferencia" className="space-y-2">
          <p className="text-sm text-muted-foreground">Itens recolhidos com problema, usados ou sem condição confirmada. Ficam fora do estoque disponível até a conferência.</p>
          {emConferencia.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item aguardando conferência.</p>}
          {emConferencia.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
              <div>
                <div className="font-medium">{i.produto} · {i.cheios} cheio(s){i.vazios ? ` · ${i.vazios} vasilhame(s)` : ""}</div>
                <div className="text-xs text-muted-foreground">
                  {CONDICAO_ROTULO[i.condicao] ?? i.condicao} · {i.local === "carga" ? "na carga" : "na portaria"} · {porId.get(i.reversao_id)?.pedido?.client_name ?? ""} · {quando(i.criado_em)}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setConferir(i)}>Conferir</Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="space-y-3">
          {encerradas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma reversão encerrada no período.</p>}
          {encerradas.map((r) => <ReversaoCard key={r.id} r={r} />)}
        </TabsContent>
      </Tabs>

      <DecidirDialog r={decidir} onClose={() => setDecidir(null)} />
      <ConfirmarFisicoDialog open={!!fisico} onOpenChange={(o) => !o && setFisico(null)} reversao={fisico}
        cliente={fisico?.pedido?.client_name} cargas={cargasAbertas} />
      <ReembolsoDialog e={reembolso} cliente={reembolso ? porId.get(reembolso.reversao_id)?.pedido?.client_name : undefined} onClose={() => setReembolso(null)} />
      <ConferenciaDialog item={conferir} onClose={() => setConferir(null)} />
    </div>
  );
}

export function ReversaoCard({ r, acoes }: { r: ReversaoComPedido; acoes?: React.ReactNode }) {
  const falta = pendenciasFisicas(r);
  const efeitos = efeitosTexto(r.efeitos);
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-medium">{TIPO_ROTULO[r.tipo]} · {r.pedido?.client_name ?? "Cliente"}</div>
            <div className="text-xs text-muted-foreground">
              Venda original: {r.produto} · {r.quantidade} un. · {brl(Number(r.valor_venda))} · {quando(r.data_venda)}
            </div>
          </div>
          <Badge variant={corStatus(r.status)}>{STATUS_ROTULO[r.status]}</Badge>
        </div>
        <div className="text-sm">Motivo: {r.motivo}</div>
        <div className="text-xs text-muted-foreground">
          Solicitado por {r.solicitado_por_nome ?? "—"} em {quando(r.solicitado_em)}
          {r.decidido_em ? ` · ${r.status === "recusada" ? "recusado" : "autorizado"} por ${r.decidido_por_nome ?? "—"} em ${quando(r.decidido_em)}` : ""}
          {r.data_operacao ? ` · ajuste na data ${r.data_operacao.split("-").reverse().join("/")}` : ""}
        </div>
        {r.recusa_motivo && <div className="text-xs text-destructive">Recusa: {r.recusa_motivo}</div>}
        {r.status === "aguardando_retorno" && falta.pendente && <div className="text-sm">Pendente: {falta.textos.join(" · ")}</div>}
        {(Number(r.valor_reembolso) > 0 || Number(r.promissoria_cancelada) > 0) && (
          <div className="text-sm">
            {Number(r.promissoria_cancelada) > 0 && <>Cobrança cancelada: {brl(Number(r.promissoria_cancelada))} · </>}
            A reembolsar: {brl(Number(r.valor_reembolso))} · Reembolsado: {brl(Number(r.valor_reembolsado))}
          </div>
        )}
        {efeitos.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-muted-foreground">{efeitos.map((t, i) => <li key={i}>{t}</li>)}</ul>
        )}
        {acoes && <div className="flex flex-wrap gap-2 pt-1">{acoes}</div>}
      </CardContent>
    </Card>
  );
}
