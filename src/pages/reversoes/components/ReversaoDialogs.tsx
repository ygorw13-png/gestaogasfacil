import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { acao } from "@/lib/g1/acoes";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { useAtualizarAposReversao, type ItemConferencia, type ReversaoComPedido } from "@/hooks/useReversoes";
import { CONDICAO_ROTULO, TIPO_ROTULO, exigeReferencia, type ReembolsoLinha } from "@/lib/g1/reversao";
import { brl, FORMA_ROTULO } from "./formato";

/** Administrador autoriza (o banco grava os efeitos numa transação) ou recusa com motivo. */
export function DecidirDialog({ r, onClose }: { r: ReversaoComPedido | null; onClose: () => void }) {
  const atualizar = useAtualizarAposReversao();
  const op = useOperacaoUnica("reversao-decisao");
  const [modo, setModo] = useState<"autorizar" | "recusar">("autorizar");
  const [pagou, setPagou] = useState<"" | "sim" | "nao">("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const precisaPagamento = r?.tipo === "duplicidade" && r.pagamento_duplicado === null;
  const pronto = !!r && !op.enviando && (modo === "recusar" ? motivo.trim().length >= 5 : (!precisaPagamento || !!pagou));
  const fechar = () => { setMotivo(""); setPagou(""); setModo("autorizar"); setErro(null); onClose(); };

  const enviar = async () => {
    if (!r || !pronto) return;
    setErro(null);
    try {
      if (modo === "autorizar") {
        const args = { _id: r.id, _pagamento_duplicado: precisaPagamento ? pagou === "sim" : null };
        await op.executar({ modo, ...args }, (chave) => acao("reversao_autorizar", { ...args, _chave: chave }));
        toast.success("Reversão autorizada", { description: "Os efeitos foram gravados. Confira o retorno do produto e o reembolso, se houver." });
      } else {
        const args = { _id: r.id, _motivo: motivo.trim() };
        await op.executar({ modo, ...args }, (chave) => acao("reversao_recusar", { ...args, _chave: chave }));
        toast.success("Solicitação recusada");
      }
      atualizar();
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    }
  };

  return (
    <Dialog open={!!r} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Decidir solicitação</DialogTitle>
          <DialogDescription>{r ? `${TIPO_ROTULO[r.tipo]} · ${r.pedido?.client_name ?? ""} · ${r.produto} · ${brl(Number(r.valor_venda))}` : ""}</DialogDescription>
        </DialogHeader>
        {r && (
          <div className="space-y-3">
            <p className="text-sm">Motivo informado: {r.motivo}</p>
            <RadioGroup value={modo} onValueChange={(v) => setModo(v as typeof modo)} className="flex gap-4 text-sm">
              <label className="flex items-center gap-1"><RadioGroupItem value="autorizar" /> Autorizar</label>
              <label className="flex items-center gap-1"><RadioGroupItem value="recusar" /> Recusar</label>
            </RadioGroup>
            {modo === "autorizar" && precisaPagamento && (
              <div className="space-y-1">
                <Label>O cliente pagou duas vezes?</Label>
                <RadioGroup value={pagou} onValueChange={(v) => setPagou(v as typeof pagou)} className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1"><RadioGroupItem value="nao" /> Não</label>
                  <label className="flex items-center gap-1"><RadioGroupItem value="sim" /> Sim (reembolso pendente)</label>
                </RadioGroup>
              </div>
            )}
            {modo === "recusar" && (
              <div className="space-y-1">
                <Label htmlFor="motivo-recusa">Motivo da recusa</Label>
                <Textarea id="motivo-recusa" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
            )}
            {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Voltar</Button>
          <Button variant={modo === "recusar" ? "destructive" : "default"} disabled={!pronto} onClick={enviar}>
            {op.enviando ? "Registrando…" : modo === "autorizar" ? "Autorizar" : "Recusar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Reembolso realizado: só depois de confirmado. Dinheiro: de onde saiu. PIX/cartão: conta da empresa + referência. */
export function ReembolsoDialog({ e, cliente, onClose }: { e: ReembolsoLinha | null; cliente?: string; onClose: () => void }) {
  const atualizar = useAtualizarAposReversao();
  const op = useOperacaoUnica("reembolso");
  const [origem, setOrigem] = useState("");
  const [ref, setRef] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const rec = useQuery({
    queryKey: ["reversoes", "recebimento", e?.id],
    enabled: !!e,
    queryFn: async () => {
      const { data, error } = await supabase.from("recebimentos").select("id, forma, destino, origem, acerto_id").eq("order_id", e!.order_id);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!e) return null;
  const fechar = () => { setOrigem(""); setRef(""); setErro(null); onClose(); };
  const pix = exigeReferencia(e.forma);
  const r0 = rec.data?.find((x) => x.forma === e.forma) ?? rec.data?.[0];
  const destino = r0?.destino ?? (r0 && (r0.origem === "entrega" || r0.origem === "venda_rua") ? "entregador" : "caixa");
  const acertado = !!e.acerto_original_id || !!r0?.acerto_id;
  const opcoes = pix ? [] : [
    { v: "caixa", t: "Caixa da portaria" },
    ...(!acertado && destino === "entregador" ? [{ v: "entregador", t: "Dinheiro ainda com o entregador (desconta no próximo acerto)" }] : []),
    ...(!acertado && destino === "cobrador" ? [{ v: "cobrador", t: "Dinheiro ainda com o cobrador" }] : []),
  ];
  const pronto = !op.enviando && (pix ? ref.trim().length >= 4 : !!origem);

  const enviar = async () => {
    if (!pronto) return;
    setErro(null);
    const args = { _id: e.id, _origem: pix ? "conta_empresa" : origem, _referencia: ref.trim() || null };
    try {
      await op.executar(args, (chave) => acao("reembolso_registrar", { ...args, _chave: chave }));
      atualizar();
      toast.success("Reembolso registrado como realizado");
      fechar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar.");
    }
  };

  return (
    <Dialog open={!!e} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar reembolso feito</DialogTitle>
          <DialogDescription>{cliente ?? "Cliente"} · {brl(e.valor)} · {FORMA_ROTULO[e.forma] ?? e.forma}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Registre só depois que o cliente recebeu. O sistema não faz transferência nem estorno na operadora.</p>
          {pix ? (
            <div className="space-y-1">
              <Label htmlFor="reemb-ref">Referência ou comprovante (sai da conta da empresa)</Label>
              <Input id="reemb-ref" value={ref} onChange={(ev) => setRef(ev.target.value)} placeholder="Ex.: ID do PIX, nº do estorno" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>De onde saiu o dinheiro</Label>
              <RadioGroup value={origem} onValueChange={setOrigem} className="space-y-1 text-sm">
                {opcoes.map((o) => <label key={o.v} className="flex items-center gap-2"><RadioGroupItem value={o.v} /> {o.t}</label>)}
              </RadioGroup>
              {acertado && <p className="text-xs text-muted-foreground">O dinheiro já foi entregue no acerto: o reembolso sai do caixa e o acerto original fica como está.</p>}
              <div className="space-y-1">
                <Label htmlFor="reemb-obs" className="text-xs">Observação (opcional)</Label>
                <Input id="reemb-obs" value={ref} onChange={(ev) => setRef(ev.target.value)} />
              </div>
            </div>
          )}
          {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Voltar</Button>
          <Button disabled={!pronto} onClick={enviar}>{op.enviando ? "Registrando…" : "Confirmar reembolso"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Item recolhido com problema: liberar para o estoque disponível ou baixar, com o que foi conferido. */
export function ConferenciaDialog({ item, onClose }: { item: ItemConferencia | null; onClose: () => void }) {
  const atualizar = useAtualizarAposReversao();
  const op = useOperacaoUnica("conferencia");
  const [resultado, setResultado] = useState<"" | "liberado" | "baixado">("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  if (!item) return null;
  const fechar = () => { setResultado(""); setMotivo(""); setErro(null); onClose(); };
  const pronto = !!resultado && motivo.trim().length >= 5 && !op.enviando;
  const enviar = async () => {
    if (!pronto) return;
    setErro(null);
    const args = { _id: item.id, _resultado: resultado, _motivo: motivo.trim() };
    try {
      await op.executar(args, (chave) => acao("conferencia_resolver", { ...args, _chave: chave }));
      atualizar();
      toast.success(resultado === "liberado" ? "Item liberado para o estoque" : "Item baixado (fora do estoque)");
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    }
  };
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && fechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conferir item recolhido</DialogTitle>
          <DialogDescription>{item.produto} · {item.cheios} cheio(s){item.vazios ? ` · ${item.vazios} vasilhame(s)` : ""} · {CONDICAO_ROTULO[item.condicao] ?? item.condicao}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <RadioGroup value={resultado} onValueChange={(v) => setResultado(v as typeof resultado)} className="space-y-1 text-sm">
            <label className="flex items-center gap-2"><RadioGroupItem value="liberado" /> Em condição de venda: volta ao estoque disponível</label>
            <label className="flex items-center gap-2"><RadioGroupItem value="baixado" /> Sem condição: fica fora do estoque (baixa)</label>
          </RadioGroup>
          <div className="space-y-1">
            <Label htmlFor="conf-motivo">O que foi conferido</Label>
            <Textarea id="conf-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar}>Voltar</Button>
          <Button disabled={!pronto} onClick={enviar}>{op.enviando ? "Registrando…" : "Confirmar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
