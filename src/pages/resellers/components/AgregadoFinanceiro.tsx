import { useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, HandCoins, Wallet } from "lucide-react";
import { acao } from "@/lib/g1/acoes";
import { lerValor } from "@/lib/formasPagamento";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import {
  brl, NOME_FORMA, NOME_TIPO, useAgregadoFinanceiro,
  type AcertoFin, type CreditoFin, type FinanceiroAgregado, type RetiradaAgregado,
} from "../hooks/useAgregadoConta";
import { gerarExtratoAgregadoPdf } from "../utils/extratoAgregadoPdf";

const FORMAS = [
  { v: "money", l: "Dinheiro (entra no caixa)" },
  { v: "pix", l: "PIX (conta da empresa)" },
  { v: "credit", l: "Cartão de crédito (conta da empresa)" },
  { v: "debit", l: "Cartão de débito (conta da empresa)" },
];
const dt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const num = (t: string) => { const n = lerValor(t); return n !== null && Number.isFinite(n) ? n : 0; };
const r2 = (n: number) => Math.round(n * 100) / 100;

function useAtualizar() {
  const qc = useQueryClient();
  return () => ["agregado-financeiro", "agregado-conta", "sales_history", "vendas_hoje"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/** Diálogo de ação administrativa: uma chave por conteúdo, fecha só após gravação confirmada. */
function AcaoDialog({ open, onOpenChange, titulo, descricao, children, pronto, onConfirmar, rotulo = "Confirmar", prefixo, conteudo }: {
  open: boolean; onOpenChange: (o: boolean) => void; titulo: string; descricao?: ReactNode; children: ReactNode; pronto: boolean;
  onConfirmar: (chave: string) => Promise<unknown>; rotulo?: string; prefixo: string; conteudo: unknown;
}) {
  const op = useOperacaoUnica(prefixo);
  const atualizar = useAtualizar();
  const [erro, setErro] = useState<string | null>(null);
  const enviar = async () => {
    setErro(null);
    try {
      await op.executar(conteudo, onConfirmar);
      atualizar();
      toast.success("Registrado");
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !op.enviando && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descricao && <DialogDescription>{descricao}</DialogDescription>}
        </DialogHeader>
        <fieldset disabled={op.enviando} className="space-y-3 border-0 p-0 m-0 min-w-0">{children}</fieldset>
        {erro && <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm">{erro}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={op.enviando}>Cancelar</Button>
          <Button onClick={enviar} disabled={!pronto || op.enviando}>{op.enviando ? "Gravando…" : rotulo}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormaSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Forma real do recebimento" /></SelectTrigger>
      <SelectContent>{FORMAS.map((f) => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

/** Escolha explícita de créditos + dinheiro novo, com o resumo antes de confirmar. */
function Pagamento({ devido, creditos, usos, setUsos, dinheiro, setDinheiro, forma, setForma, confirmaCredito, setConfirmaCredito }: {
  devido: number; creditos: CreditoFin[]; usos: Record<string, string>; setUsos: (u: Record<string, string>) => void;
  dinheiro: string; setDinheiro: (v: string) => void; forma: string; setForma: (v: string) => void;
  confirmaCredito: boolean; setConfirmaCredito: (v: boolean) => void;
}) {
  const disponiveis = creditos.filter((c) => !c.anulado && c.saldo > 0);
  const totalDisp = disponiveis.reduce((s, c) => s + c.saldo, 0);
  const usado = r2(Object.values(usos).reduce((s, v) => s + num(v), 0));
  const novo = num(dinheiro);
  const resta = r2(devido - usado - novo);
  return (
    <div className="space-y-3">
      <div className="rounded-md border p-2 space-y-2">
        <p className="text-sm font-medium">Por contas anteriores (crédito disponível {brl(totalDisp)})</p>
        {disponiveis.length === 0 && <p className="text-xs text-muted-foreground">Nenhum crédito disponível.</p>}
        {disponiveis.map((c) => {
          const marcado = c.id in usos;
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
              <Checkbox checked={marcado} onCheckedChange={(v) => {
                const u = { ...usos };
                if (v) u[c.id] = String(r2(Math.max(0, Math.min(c.saldo, devido - usado)))).replace(".", ",");
                else delete u[c.id];
                setUsos(u); setConfirmaCredito(false);
              }} aria-label={`Usar crédito de ${dt(c.recebido_em)}`} />
              <span className="flex-1">{dt(c.recebido_em)} · {c.tipo === "credito_ajuste" ? "sobra de acerto" : NOME_FORMA[c.forma ?? ""] ?? c.forma} · saldo {brl(c.saldo)}</span>
              {marcado && (
                <Input className="h-8 w-28" inputMode="decimal" value={usos[c.id]} aria-label="Crédito a utilizar"
                  onChange={(e) => { setUsos({ ...usos, [c.id]: e.target.value.replace(/[^0-9.,]/g, "") }); setConfirmaCredito(false); }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Dinheiro novo recebido (R$)</Label>
          <Input inputMode="decimal" value={dinheiro} placeholder="0,00" onChange={(e) => setDinheiro(e.target.value.replace(/[^0-9.,]/g, ""))} />
        </div>
        {novo > 0 && <div className="space-y-1"><Label>Forma</Label><FormaSelect value={forma} onChange={setForma} /></div>}
      </div>
      <div className="rounded-md bg-muted/50 p-2 text-sm space-y-0.5">
        <div className="flex justify-between"><span>Valor devido</span><span>{brl(devido)}</span></div>
        <div className="flex justify-between"><span>Crédito disponível</span><span>{brl(totalDisp)}</span></div>
        <div className="flex justify-between"><span>Crédito escolhido</span><span>{brl(usado)}</span></div>
        <div className="flex justify-between"><span>Dinheiro novo</span><span>{brl(novo)}</span></div>
        <div className="flex justify-between font-medium border-t pt-1">
          <span>{resta >= 0 ? "Valor ainda devido" : "Passa do devido"}</span><span>{brl(Math.abs(resta))}</span>
        </div>
        <div className="flex justify-between text-muted-foreground"><span>Crédito que continua disponível</span><span>{brl(r2(totalDisp - usado))}</span></div>
      </div>
      {usado > 0 && (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={confirmaCredito} onCheckedChange={(v) => setConfirmaCredito(v === true)} />
          <span>Confirmo usar {brl(usado)} de crédito do agregado neste acerto (não entra de novo no caixa).</span>
        </label>
      )}
    </div>
  );
}

const pagamentoValido = (devido: number, usos: Record<string, string>, dinheiro: string, forma: string, confirma: boolean, creditos: CreditoFin[]) => {
  const usado = r2(Object.values(usos).reduce((s, v) => s + num(v), 0));
  const novo = num(dinheiro);
  if (Object.entries(usos).some(([id, v]) => num(v) <= 0 || num(v) > (creditos.find((c) => c.id === id)?.saldo ?? 0))) return false;
  if (usado > 0 && !confirma) return false;
  if (novo > 0 && !forma) return false;
  return r2(usado + novo) <= devido;
};
const listaCreditos = (usos: Record<string, string>) => Object.entries(usos).map(([id, v]) => ({ id, valor: r2(num(v)) }));

export function AgregadoFinanceiro({ reseller, retiradas }: { reseller: { id: string; name: string }; retiradas: RetiradaAgregado[] }) {
  const { data: fin, isLoading, error } = useAgregadoFinanceiro(reseller.id, true);
  const [dlg, setDlg] = useState<null | { tipo: string; acerto?: AcertoFin; credito?: CreditoFin }>(null);
  const fechar = () => setDlg(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando valores…</p>;
  if (error || !fin) return <p className="text-sm text-destructive">Valores do agregado indisponíveis.</p>;
  const credito = fin.creditos.filter((c) => !c.anulado).reduce((s, c) => s + c.saldo, 0);
  const devido = fin.acertos.reduce((s, a) => s + Math.max(a.saldo, 0), 0);

  return (
    <div className="space-y-3 rounded-md border border-primary/30 p-3">
      <p className="text-sm font-medium">Financeiro (só administrador)</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Preço P13</p>
          <p className="text-lg font-bold">{fin.precos.P13 ? brl(fin.precos.P13) : "—"}</p>
          <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setDlg({ tipo: "preco" })}>Alterar (não recalcula o passado)</Button>
        </CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Acertos com saldo devedor</p><p className="text-lg font-bold">{brl(devido)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Crédito disponível (por conta)</p><p className="text-lg font-bold">{brl(credito)}</p></CardContent></Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setDlg({ tipo: "porconta" })}><Wallet className="mr-1 h-4 w-4" /> Registrar por conta</Button>
        <Button size="sm" onClick={() => setDlg({ tipo: "acerto" })} disabled={!retiradas.some((r) => r.pendente > 0)}><HandCoins className="mr-1 h-4 w-4" /> Fazer acerto</Button>
        <Button size="sm" variant="outline" onClick={() => gerarExtratoAgregadoPdf(reseller.name, retiradas, fin)}><FileText className="mr-1 h-4 w-4" /> Extrato (PDF)</Button>
      </div>

      {fin.acertos.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm" data-sem-cartoes>
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
              <th className="p-2 text-left">Acerto</th><th className="p-2 text-right">Botijões</th><th className="p-2 text-right">Valor</th>
              <th className="p-2 text-right">Crédito usado</th><th className="p-2 text-right">Recebido</th><th className="p-2 text-right">Saldo</th><th className="p-2" />
            </tr></thead>
            <tbody>{fin.acertos.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{dt(a.criado_em)}</td>
                <td className="p-2 text-right">{(a.itens ?? []).reduce((s, i) => s + i.quantidade, 0)}</td>
                <td className="p-2 text-right">{brl(a.valor + a.ajustes)}{a.ajustes !== 0 && <span className="block text-xs text-muted-foreground">combinado {brl(a.valor)}</span>}</td>
                <td className="p-2 text-right">{brl(a.credito_usado)}</td>
                <td className="p-2 text-right">{brl(a.recebido)}</td>
                <td className="p-2 text-right">{a.saldo > 0 ? <Badge variant="destructive">{brl(a.saldo)}</Badge> : <Badge variant="secondary">Quitado</Badge>}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  {a.saldo > 0 && <Button size="sm" variant="outline" className="h-7 mr-1" onClick={() => setDlg({ tipo: "receber", acerto: a })}>Receber</Button>}
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setDlg({ tipo: "ajuste", acerto: a })}>Ajustar</Button>
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}

      {fin.creditos.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm" data-sem-cartoes>
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
              <th className="p-2 text-left">Por conta / crédito</th><th className="p-2 text-left">Forma</th><th className="p-2 text-right">Valor</th><th className="p-2 text-right">Disponível</th><th className="p-2" />
            </tr></thead>
            <tbody>{fin.creditos.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{dt(c.recebido_em)}{c.observacoes && <span className="block text-xs text-muted-foreground">{c.observacoes}</span>}</td>
                <td className="p-2">{c.tipo === "credito_ajuste" ? "Sobra de acerto" : NOME_FORMA[c.forma ?? ""] ?? c.forma}</td>
                <td className="p-2 text-right">{brl(c.valor)}</td>
                <td className="p-2 text-right">{c.anulado ? <Badge variant="outline">Anulado</Badge> : brl(c.saldo)}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  {!c.anulado && c.saldo > 0 && <Button size="sm" variant="ghost" className="h-7" onClick={() => setDlg({ tipo: "devolver", credito: c })}>Devolver</Button>}
                  {!c.anulado && c.tipo === "por_conta" && c.saldo === c.valor && <Button size="sm" variant="ghost" className="h-7" onClick={() => setDlg({ tipo: "anular", credito: c })}>Anular</Button>}
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}

      {fin.lancamentos.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Histórico financeiro ({fin.lancamentos.length})</summary>
          <ul className="mt-2 space-y-1">{fin.lancamentos.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 border-b py-1">
              <span>{dt(l.recebido_em)} · {NOME_TIPO[l.tipo] ?? l.tipo}{l.forma ? ` · ${NOME_FORMA[l.forma] ?? l.forma}` : ""}{l.registrado_por ? ` · ${l.registrado_por}` : ""}
                {l.observacoes && <span className="block text-xs text-muted-foreground">{l.observacoes}</span>}</span>
              <span className={l.anulado_em ? "line-through text-muted-foreground" : ""}>{brl(l.valor)}</span>
            </li>))}</ul>
        </details>
      )}

      {dlg?.tipo === "preco" && <PrecoDialog reseller={reseller} atual={fin.precos.P13} onClose={fechar} />}
      {dlg?.tipo === "porconta" && <PorContaDialog reseller={reseller} onClose={fechar} />}
      {dlg?.tipo === "acerto" && <AcertoDialog reseller={reseller} retiradas={retiradas} fin={fin} onClose={fechar} />}
      {dlg?.tipo === "receber" && dlg.acerto && <ReceberDialog acerto={dlg.acerto} fin={fin} onClose={fechar} />}
      {dlg?.tipo === "ajuste" && dlg.acerto && <AjusteDialog acerto={dlg.acerto} onClose={fechar} />}
      {dlg?.tipo === "devolver" && dlg.credito && <DevolverCreditoDialog credito={dlg.credito} onClose={fechar} />}
      {dlg?.tipo === "anular" && dlg.credito && <AnularDialog credito={dlg.credito} onClose={fechar} />}
    </div>
  );
}

function PrecoDialog({ reseller, atual, onClose }: { reseller: { id: string }; atual?: number; onClose: () => void }) {
  const [v, setV] = useState(atual ? String(atual).replace(".", ",") : "");
  const preco = num(v);
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo="Preço P13 do agregado" prefixo="agregado-preco" conteudo={{ reseller: reseller.id, preco }}
      descricao="Sigiloso: só o administrador vê. Alterar não muda acertos já feitos." pronto={preco > 0}
      onConfirmar={() => acao("agregado_preco_definir", { _reseller_id: reseller.id, _produto: "P13", _preco: preco })}>
      <Label>Preço por botijão (R$)</Label>
      <Input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,]/g, ""))} />
    </AcaoDialog>
  );
}

function PorContaDialog({ reseller, onClose }: { reseller: { id: string; name: string }; onClose: () => void }) {
  const [v, setV] = useState("");
  const [forma, setForma] = useState("");
  const agora = useMemo(() => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }, []);
  const [quando, setQuando] = useState(agora);
  const [obs, setObs] = useState("");
  const valor = num(v);
  const conteudo = { reseller: reseller.id, valor, forma, quando, obs: obs.trim() };
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo={`Registrar por conta — ${reseller.name}`} prefixo="agregado-porconta" conteudo={conteudo}
      descricao="Dinheiro efetivamente recebido e ainda livre para usar em acertos. Não é venda nem quita botijões sozinho."
      pronto={valor > 0 && !!forma && !!quando}
      onConfirmar={(chave) => acao("agregado_por_conta_registrar", { _reseller_id: reseller.id, _valor: valor, _forma: forma,
        _recebido_em: new Date(quando).toISOString(), _observacoes: obs.trim() || null, _chave: chave })}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1"><Label>Valor (R$)</Label><Input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,]/g, ""))} /></div>
        <div className="space-y-1"><Label>Recebido em</Label><Input type="datetime-local" value={quando} max={agora} onChange={(e) => setQuando(e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label>Forma real</Label><FormaSelect value={forma} onChange={setForma} /></div>
      <div className="space-y-1"><Label>Observação (opcional)</Label><Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
    </AcaoDialog>
  );
}

function AcertoDialog({ reseller, retiradas, fin, onClose }: { reseller: { id: string; name: string }; retiradas: RetiradaAgregado[]; fin: FinanceiroAgregado; onClose: () => void }) {
  const pendentes = retiradas.filter((r) => r.pendente > 0);
  const [sel, setSel] = useState<Record<string, number>>({});
  const [valorTxt, setValorTxt] = useState("");
  const [usos, setUsos] = useState<Record<string, string>>({});
  const [dinheiro, setDinheiro] = useState("");
  const [forma, setForma] = useState("");
  const [confirma, setConfirma] = useState(false);
  const [obs, setObs] = useState("");
  const itens = Object.entries(sel).filter(([, q]) => q > 0).map(([order_id, quantidade]) => ({ order_id, quantidade }));
  const qtd = itens.reduce((s, i) => s + i.quantidade, 0);
  const qtdP13 = itens.filter((i) => /P13/i.test(pendentes.find((p) => p.order_id === i.order_id)?.produto ?? "")).reduce((s, i) => s + i.quantidade, 0);
  const sugestao = fin.precos.P13 && qtdP13 === qtd ? r2(qtd * fin.precos.P13) : null;
  const valor = num(valorTxt);
  const qtdOk = itens.every((i) => i.quantidade <= (pendentes.find((p) => p.order_id === i.order_id)?.pendente ?? 0));
  const conteudo = { itens, valor, usos: listaCreditos(usos), dinheiro: num(dinheiro), forma, obs: obs.trim() };
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo={`Fazer acerto — ${reseller.name}`} prefixo="agregado-acerto" conteudo={conteudo} rotulo="Confirmar acerto"
      descricao="As quantidades escolhidas ficam vinculadas a este acerto e não podem ser acertadas de novo, mesmo com saldo pendente."
      pronto={itens.length > 0 && qtdOk && valor > 0 && pagamentoValido(valor, usos, dinheiro, forma, confirma, fin.creditos)}
      onConfirmar={(chave) => acao("agregado_acerto_registrar", { _reseller_id: reseller.id, _itens: itens, _valor: valor,
        _creditos: listaCreditos(usos), _pagamento: num(dinheiro) || null, _forma: num(dinheiro) > 0 ? forma : null, _observacoes: obs.trim() || null, _chave: chave })}>
      <div className="rounded-md border p-2 space-y-1 max-h-48 overflow-y-auto">
        <p className="text-sm font-medium">Retiradas ainda não acertadas</p>
        {pendentes.map((r) => (
          <div key={r.order_id} className="flex flex-wrap items-center gap-2 text-sm">
            <Checkbox checked={r.order_id in sel} onCheckedChange={(v) => { const s = { ...sel }; if (v) s[r.order_id] = r.pendente; else delete s[r.order_id]; setSel(s); }}
              aria-label={`Incluir retirada de ${dt(r.criado_em)}`} />
            <span className="flex-1">{dt(r.criado_em)} · {r.produto} · {r.pendente} de {r.quantidade}</span>
            {r.order_id in sel && (
              <Input type="number" min={1} max={r.pendente} className="h-8 w-20" value={sel[r.order_id]} aria-label="Quantidade a acertar"
                onChange={(e) => setSel({ ...sel, [r.order_id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
            )}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label>Valor combinado do acerto (R$) · {qtd} botijão(ões)</Label>
        <Input inputMode="decimal" value={valorTxt} onChange={(e) => { setValorTxt(e.target.value.replace(/[^0-9.,]/g, "")); setConfirma(false); }} />
        {sugestao !== null && qtd > 0 && (
          <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setValorTxt(String(sugestao).replace(".", ","))}>
            Usar preço cadastrado: {brl(sugestao)}
          </Button>
        )}
      </div>
      {valor > 0 && <Pagamento devido={valor} creditos={fin.creditos} usos={usos} setUsos={setUsos} dinheiro={dinheiro} setDinheiro={setDinheiro}
        forma={forma} setForma={setForma} confirmaCredito={confirma} setConfirmaCredito={setConfirma} />}
      <div className="space-y-1"><Label>Observação (opcional)</Label><Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} /></div>
    </AcaoDialog>
  );
}

function ReceberDialog({ acerto, fin, onClose }: { acerto: AcertoFin; fin: FinanceiroAgregado; onClose: () => void }) {
  const [usos, setUsos] = useState<Record<string, string>>({});
  const [dinheiro, setDinheiro] = useState("");
  const [forma, setForma] = useState("");
  const [confirma, setConfirma] = useState(false);
  const algo = Object.keys(usos).length > 0 || num(dinheiro) > 0;
  const conteudo = { acerto: acerto.id, usos: listaCreditos(usos), dinheiro: num(dinheiro), forma };
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo="Receber acerto" prefixo="agregado-receber" conteudo={conteudo}
      descricao={`Acerto de ${dt(acerto.criado_em)}. Complemento não cria outra venda nem baixa estoque.`}
      pronto={algo && pagamentoValido(acerto.saldo, usos, dinheiro, forma, confirma, fin.creditos)}
      onConfirmar={(chave) => acao("agregado_acerto_pagar", { _acerto_id: acerto.id, _creditos: listaCreditos(usos), _pagamento: num(dinheiro) || null,
        _forma: num(dinheiro) > 0 ? forma : null, _observacoes: null, _chave: chave })}>
      <Pagamento devido={acerto.saldo} creditos={fin.creditos} usos={usos} setUsos={setUsos} dinheiro={dinheiro} setDinheiro={setDinheiro}
        forma={forma} setForma={setForma} confirmaCredito={confirma} setConfirmaCredito={setConfirma} />
    </AcaoDialog>
  );
}

function AjusteDialog({ acerto, onClose }: { acerto: AcertoFin; onClose: () => void }) {
  const [sentido, setSentido] = useState<"menos" | "mais">("menos");
  const [v, setV] = useState("");
  const [motivo, setMotivo] = useState("");
  const valor = (sentido === "menos" ? -1 : 1) * num(v);
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo="Ajuste administrativo do acerto" prefixo="agregado-ajuste" conteudo={{ acerto: acerto.id, valor, motivo: motivo.trim() }}
      descricao="O acerto não é apagado e o estoque não se move. Se já foi pago além do novo valor, a sobra vira crédito do agregado."
      pronto={num(v) > 0 && motivo.trim().length >= 5}
      onConfirmar={(chave) => acao("agregado_acerto_ajustar", { _acerto_id: acerto.id, _valor: valor, _motivo: motivo.trim(), _chave: chave })}>
      <Select value={sentido} onValueChange={(x) => setSentido(x as "menos" | "mais")}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="menos">Diminuir o valor do acerto</SelectItem><SelectItem value="mais">Aumentar o valor do acerto</SelectItem></SelectContent>
      </Select>
      <div className="space-y-1"><Label>Valor (R$)</Label><Input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,]/g, ""))} /></div>
      <div className="space-y-1"><Label>Motivo</Label><Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
    </AcaoDialog>
  );
}

function DevolverCreditoDialog({ credito, onClose }: { credito: CreditoFin; onClose: () => void }) {
  const [v, setV] = useState("");
  const [forma, setForma] = useState("");
  const [motivo, setMotivo] = useState("");
  const valor = num(v);
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo="Devolver crédito ao agregado" prefixo="agregado-devolver" conteudo={{ c: credito.id, valor, forma, motivo: motivo.trim() }}
      descricao={`Registre só o dinheiro efetivamente devolvido (disponível ${brl(credito.saldo)}). Nenhuma transferência é feita pelo sistema.`}
      pronto={valor > 0 && valor <= credito.saldo && !!forma && motivo.trim().length >= 5}
      onConfirmar={(chave) => acao("agregado_credito_devolver", { _credito_id: credito.id, _valor: valor, _forma: forma, _motivo: motivo.trim(), _chave: chave })}>
      <div className="space-y-1"><Label>Valor devolvido (R$)</Label><Input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,]/g, ""))} /></div>
      <div className="space-y-1"><Label>Como foi devolvido</Label><FormaSelect value={forma} onChange={setForma} /></div>
      <div className="space-y-1"><Label>Motivo</Label><Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
    </AcaoDialog>
  );
}

function AnularDialog({ credito, onClose }: { credito: CreditoFin; onClose: () => void }) {
  const [motivo, setMotivo] = useState("");
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo="Anular por conta lançado por engano" prefixo="agregado-anular" conteudo={{ c: credito.id, motivo: motivo.trim() }}
      descricao={`Por conta de ${brl(credito.valor)} em ${dt(credito.recebido_em)}. Só é possível porque nada dele foi usado. Fica no histórico como anulado.`}
      pronto={motivo.trim().length >= 5} rotulo="Anular"
      onConfirmar={(chave) => acao("agregado_por_conta_anular", { _id: credito.id, _motivo: motivo.trim(), _chave: chave })}>
      <div className="space-y-1"><Label>Motivo</Label><Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
    </AcaoDialog>
  );
}

/** Devolução de retirada já acertada: ajuste vinculado ao acerto + reversão (estoque volta só com retorno físico confirmado). */
export function DevolucaoAcertadaDialog({ retirada, fin, onClose }: { retirada: RetiradaAgregado; fin: FinanceiroAgregado | undefined; onClose: () => void }) {
  const acertos = (fin?.acertos ?? []).filter((a) => (a.itens ?? []).some((i) => i.order_id === retirada.order_id));
  const [acertoId, setAcertoId] = useState(acertos[0]?.id ?? "");
  const [v, setV] = useState("");
  const [motivo, setMotivo] = useState("");
  const valor = num(v);
  return (
    <AcaoDialog open onOpenChange={(o) => !o && onClose()} titulo="Devolução de retirada já acertada" prefixo="agregado-devacertada"
      conteudo={{ o: retirada.order_id, acertoId, valor, motivo: motivo.trim() }} rotulo="Registrar devolução"
      descricao="O acerto é preservado e recebe um ajuste vinculado. O estoque só volta quando a devolução física for confirmada em Reversões."
      pronto={!!acertoId && valor > 0 && motivo.trim().length >= 5}
      onConfirmar={(chave) => acao("agregado_devolucao_acertada", { _order_id: retirada.order_id, _acerto_id: acertoId, _valor_ajuste: valor, _motivo: motivo.trim(), _chave: chave })}>
      <p className="text-sm">{dt(retirada.criado_em)} · {retirada.produto} · {retirada.quantidade} un. (devolução integral)</p>
      <div className="space-y-1"><Label>Acerto</Label>
        <Select value={acertoId} onValueChange={setAcertoId}>
          <SelectTrigger><SelectValue placeholder="Escolha o acerto" /></SelectTrigger>
          <SelectContent>{acertos.map((a) => <SelectItem key={a.id} value={a.id}>{dt(a.criado_em)} · {brl(a.valor + a.ajustes)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Quanto o acerto diminui (R$)</Label><Input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9.,]/g, ""))} /></div>
      <div className="space-y-1"><Label>Motivo</Label><Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
    </AcaoDialog>
  );
}

