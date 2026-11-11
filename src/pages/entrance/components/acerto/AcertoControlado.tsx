import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { acao } from "@/lib/g1/acoes";
import { rotuloProduto, useCargaResumo } from "@/hooks/useCarga";
import { FUSO_OPERACIONAL } from "@/lib/dataOperacional";

const brl = (v: number) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const quando = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO_OPERACIONAL, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

interface Aguardando { destino: "entregador" | "cobrador"; responsavel_id: string; responsavel_nome: string; qtd: number; total: number }
interface Previa { categoria: "entregar" | "informativo"; forma: string; qtd: number; total: number }
interface AcertoLinha {
  id: string; entregador_nome: string; data: string; status: string; conferido_em: string;
  dinheiro_esperado: number | null; dinheiro_entregue: number | null; diferenca: number | null;
  total_pix: number; total_cartao: number; motivo_divergencia: string | null;
}

/**
 * Acerto registrado (SQL 008): confere o dinheiro em espécie que ficou com o entregador contra o valor
 * entregue. PIX e cartão aparecem só como informação (decisão 7 pendente: destino desses valores).
 */
export function AcertoControlado() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: entregadores = [] } = useEntregadoresApp();
  const [entregador, setEntregador] = useState<string>("");
  const [entregue, setEntregue] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("acerto");

  const aguardando = useQuery({
    queryKey: ["acerto", "aguardando"],
    queryFn: () => acao<Aguardando[]>("dinheiro_aguardando_acerto", {}),
    refetchInterval: 60_000,
  });
  const previa = useQuery({
    queryKey: ["acerto", "previa", entregador],
    enabled: !!entregador,
    queryFn: () => acao<Previa[]>("acerto_previa", { _entregador_id: entregador }),
  });
  const historico = useQuery({
    queryKey: ["acerto", "historico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("acertos_entregador")
        .select("id, entregador_nome, data, status, conferido_em, dinheiro_esperado, dinheiro_entregue, diferenca, total_pix, total_cartao, motivo_divergencia")
        .order("conferido_em", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as AcertoLinha[];
    },
  });
  const carga = useCargaResumo(entregador || null);

  const esperado = useMemo(() => (previa.data ?? []).filter((p) => p.categoria === "entregar").reduce((s, p) => s + Number(p.total), 0), [previa.data]);
  const qtdEsperado = useMemo(() => (previa.data ?? []).filter((p) => p.categoria === "entregar").reduce((s, p) => s + p.qtd, 0), [previa.data]);
  const informativos = (previa.data ?? []).filter((p) => p.categoria === "informativo");

  useEffect(() => { setEntregue(previa.data ? esperado.toFixed(2) : ""); setMotivo(""); setErro(null); }, [entregador, previa.data, esperado]);

  const valorEntregue = Number(String(entregue).replace(",", "."));
  const diferenca = Math.round((valorEntregue - esperado) * 100) / 100;
  const precisaMotivo = !isNaN(valorEntregue) && diferenca !== 0;
  const bloqueado = !entregador || !previa.data || isNaN(valorEntregue) || valorEntregue < 0 || (precisaMotivo && motivo.trim().length < 5)
    || (qtdEsperado === 0 && valorEntregue === 0) || operacao.enviando;

  const registrar = async () => {
    if (bloqueado) return;
    setErro(null);
    const conteudo = { entregador, valor: valorEntregue, motivo: precisaMotivo ? motivo.trim() : null };
    try {
      await operacao.executar(conteudo, (chave) =>
        acao("registrar_acerto", { _entregador_id: entregador, _dinheiro_entregue: valorEntregue, _motivo: conteudo.motivo, _chave: chave }));
      qc.invalidateQueries({ queryKey: ["acerto"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      const nome = entregadores.find((e) => e.id === entregador)?.nome ?? "entregador";
      toast({
        title: diferenca === 0 ? "Acerto conferido" : "Acerto registrado com divergência",
        description: `${nome}: entregou ${brl(valorEntregue)} de ${brl(esperado)} esperados.`,
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Acerto não registrado.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Acerto dos Entregadores</h1>
        <p className="text-sm text-muted-foreground">
          Confere o dinheiro em espécie recebido nas entregas e vendas na rua. Cada acerto fica registrado e o dinheiro acertado não entra de novo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dinheiro aguardando acerto</CardTitle>
          <CardDescription>Em espécie, ainda fora do caixa da portaria.</CardDescription>
        </CardHeader>
        <CardContent>
          {aguardando.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {aguardando.isError && <p className="text-sm text-destructive" role="alert">Não foi possível consultar. Os valores não são exibidos até a consulta funcionar.</p>}
          {aguardando.data && aguardando.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum dinheiro aguardando acerto.</p>}
          {aguardando.data && aguardando.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Com quem</TableHead><TableHead className="text-center">Recebimentos</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {aguardando.data.map((a) => (
                  <TableRow key={`${a.destino}-${a.responsavel_id}`}>
                    <TableCell>{a.responsavel_nome} <Badge variant="outline" className="ml-2">{a.destino === "entregador" ? "Entregador" : "Cobrador (prestação de contas)"}</Badge></TableCell>
                    <TableCell className="text-center">{a.qtd}</TableCell>
                    <TableCell className="text-right font-semibold">{brl(a.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Registrar acerto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label>Entregador</Label>
            <Select value={entregador} onValueChange={setEntregador}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{entregadores.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {entregador && previa.isLoading && <p className="text-sm text-muted-foreground">Calculando…</p>}
          {entregador && previa.isError && <p className="text-sm text-destructive" role="alert">Não foi possível calcular o acerto agora.</p>}
          {entregador && previa.data && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Dinheiro a entregar</p>
                  <p className="text-xl font-bold">{brl(esperado)}</p>
                  <p className="text-xs text-muted-foreground">{qtdEsperado} recebimento(s) em espécie</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">PIX e cartão (somente informação)</p>
                  {informativos.length === 0 ? <p className="text-sm">Nenhum</p> : informativos.map((i) => (
                    <p key={i.forma} className="text-sm">{i.forma === "pix" ? "PIX" : "Cartão"}: {brl(i.total)} ({i.qtd})</p>
                  ))}
                  <p className="text-xs text-muted-foreground">Destino ainda não definido: não entra no valor a entregar.</p>
                </div>
              </div>

              {carga.data && carga.data.some((l) => l.cheios !== 0 || l.vazios !== 0) && (
                <p className="text-sm">
                  Na carga: {carga.data.filter((l) => l.cheios !== 0 || l.vazios !== 0).map((l) => `${rotuloProduto(l.produto)} ${l.cheios} cheio(s)/${l.vazios} vazio(s)`).join(" · ")}.{" "}
                  <Link to="/entrance/cargas" className="underline">Registrar devolução</Link>
                </p>
              )}

              <fieldset disabled={operacao.enviando} className="grid gap-3 sm:grid-cols-2 border-0 p-0 m-0 min-w-0">
                <div className="space-y-2">
                  <Label htmlFor="acerto-entregue">Dinheiro entregue agora</Label>
                  <Input id="acerto-entregue" inputMode="decimal" value={entregue} onChange={(e) => setEntregue(e.target.value.replace(/[^\d.,]/g, ""))} />
                  {precisaMotivo && <p className="text-xs text-destructive">Diferença de {brl(diferenca)}: informe o motivo.</p>}
                </div>
                {precisaMotivo && (
                  <div className="space-y-2">
                    <Label htmlFor="acerto-motivo">Motivo da diferença</Label>
                    <Textarea id="acerto-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: troco a devolver amanhã" />
                  </div>
                )}
              </fieldset>

              {erro && (
                <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
                  <p className="font-medium text-destructive">Acerto não registrado</p>
                  <p>{erro}</p>
                  {operacao.duvida && (
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); qc.invalidateQueries({ queryKey: ["acerto"] }); }}>
                      Conferir de novo e registrar como novo acerto
                    </Button>
                  )}
                </div>
              )}

              <Button onClick={registrar} disabled={bloqueado}>{operacao.enviando ? "Registrando…" : "Registrar acerto"}</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Acertos registrados</CardTitle></CardHeader>
        <CardContent>
          {historico.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {historico.isError && <p className="text-sm text-destructive" role="alert">Não foi possível carregar os acertos.</p>}
          {historico.data && historico.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum acerto registrado.</p>}
          {historico.data && historico.data.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead><TableHead>Entregador</TableHead><TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Entregue</TableHead><TableHead className="text-right">Diferença</TableHead><TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">{a.conferido_em ? quando(a.conferido_em) : a.data}</TableCell>
                      <TableCell>{a.entregador_nome}</TableCell>
                      <TableCell className="text-right">{a.dinheiro_esperado == null ? "—" : brl(a.dinheiro_esperado)}</TableCell>
                      <TableCell className="text-right">{a.dinheiro_entregue == null ? "—" : brl(a.dinheiro_entregue)}</TableCell>
                      <TableCell className="text-right">{a.diferenca == null ? "—" : brl(a.diferenca)}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "divergente" ? "destructive" : "outline"}>{a.status === "divergente" ? "Divergente" : a.status === "conferido" ? "Conferido" : a.status}</Badge>
                        {a.motivo_divergencia && <span className="block text-xs text-muted-foreground">{a.motivo_divergencia}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
