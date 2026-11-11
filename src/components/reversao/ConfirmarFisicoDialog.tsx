import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { acao } from "@/lib/g1/acoes";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { useAtualizarAposReversao } from "@/hooks/useReversoes";
import { CONDICAO_ROTULO, TIPO_ROTULO, pendenciasFisicas, type ReversaoLinha } from "@/lib/g1/reversao";

export interface CargaAberta { id: string; nome: string }

/**
 * Registra só o que aconteceu de fato: o que voltou (e em que condição), o substituto entregue
 * e o vazio devolvido ao cliente. Item com problema ou sem condição confirmada fica em conferência.
 * Entregador: só na própria carga (`cargaFixa`). Portaria: exige abertura do dia (o banco confere).
 */
export function ConfirmarFisicoDialog({ open, onOpenChange, reversao, cliente, cargas, cargaFixa }: {
  open: boolean; onOpenChange: (o: boolean) => void; reversao: ReversaoLinha | null; cliente?: string;
  cargas?: CargaAberta[]; cargaFixa?: CargaAberta | null;
}) {
  const atualizar = useAtualizarAposReversao();
  const operacao = useOperacaoUnica("reversao-fisico");
  const [local, setLocal] = useState<string>("portaria");
  const [ch, setCh] = useState("0");
  const [vr, setVr] = useState("0");
  const [vc, setVc] = useState("0");
  const [sb, setSb] = useState("0");
  const [condicao, setCondicao] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const falta = reversao ? pendenciasFisicas(reversao) : null;

  useEffect(() => {
    if (!open || !falta) return;
    setLocal(cargaFixa ? cargaFixa.id : "portaria");
    setCh(String(falta.cheios)); setVr(String(falta.vaziosRecolher)); setVc(String(falta.vaziosCliente)); setSb(String(falta.substituto));
    setCondicao(""); setObs(""); setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reversao?.id]);

  if (!reversao || !falta) return null;
  const n = (v: string) => Math.max(0, Math.floor(Number(v) || 0));
  const recolhe = n(ch) + n(vr) > 0;
  const total = n(ch) + n(vr) + n(vc) + n(sb);
  const pronto = total > 0 && (!recolhe || !!condicao) && !operacao.enviando;
  const naCarga = local !== "portaria";

  const enviar = async () => {
    if (!pronto) return;
    setErro(null);
    const args = {
      _id: reversao.id, _local: naCarga ? "carga" : "portaria", _carga_id: naCarga ? local : null,
      _cheios: n(ch), _vazios_recolhidos: n(vr), _vazios_cliente: n(vc), _substituto: n(sb),
      _condicao: recolhe ? condicao : null, _observacoes: obs.trim() || null,
    };
    try {
      await operacao.executar(args, (chave) => acao("reversao_confirmar_fisico", { ...args, _chave: chave }));
      atualizar();
      toast.success("Movimentação física registrada", {
        description: recolhe && condicao !== "intacto" || reversao.tipo === "troca"
          ? "O item recolhido ficou separado para conferência, fora do estoque disponível." : undefined,
      });
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    }
  };

  const campo = ({ id, label, v, set, max }: { id: string; label: string; v: string; set: (s: string) => void; max: number }) =>
    max > 0 ? (
      <div className="space-y-1">
        <Label htmlFor={id} className="text-xs">{label} (pendente {max})</Label>
        <Input id={id} type="number" inputMode="numeric" min={0} max={max} value={v} onChange={(e) => set(e.target.value)} />
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmar retorno físico</DialogTitle>
          <DialogDescription>
            {TIPO_ROTULO[reversao.tipo]}{cliente ? ` · ${cliente}` : ""} · {reversao.produto} · {reversao.quantidade} un.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Informe só o que foi conferido agora. O que não voltou continua pendente.</p>
          <div className="space-y-1">
            <Label>Onde foi recebido</Label>
            {cargaFixa ? (
              <p className="text-sm">Na sua carga ({cargaFixa.nome})</p>
            ) : (
              <Select value={local} onValueChange={setLocal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  {(cargas ?? []).map((c) => <SelectItem key={c.id} value={c.id}>Carga de {c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {campo({ id: "fis-ch", label: "Cheios recolhidos", v: ch, set: setCh, max: falta.cheios })}
            {campo({ id: "fis-vr", label: "Vasilhames recolhidos", v: vr, set: setVr, max: falta.vaziosRecolher })}
            {campo({ id: "fis-vc", label: "Vazios devolvidos ao cliente", v: vc, set: setVc, max: falta.vaziosCliente })}
            {campo({ id: "fis-sb", label: "Substitutos entregues", v: sb, set: setSb, max: falta.substituto })}
          </div>
          {recolhe && (
            <div className="space-y-1">
              <Label>Condição do item recolhido</Label>
              <Select value={condicao} onValueChange={setCondicao}>
                <SelectTrigger><SelectValue placeholder="Escolha a condição" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDICAO_ROTULO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {reversao.tipo === "troca" ? "Na troca, o recolhido sempre vai para conferência." : "Só item lacrado/sem uso volta direto ao estoque disponível; o resto fica em conferência."}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="fis-obs" className="text-xs">Observação (opcional)</Label>
            <Textarea id="fis-obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>
          {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button disabled={!pronto} onClick={enviar}>{operacao.enviando ? "Registrando…" : "Confirmar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
