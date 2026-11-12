import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { useEntregadoresApp } from "@/hooks/useEntregadoresApp";
import { acao } from "@/lib/g1/acoes";
import { motivoRevisao, numeroPedido } from "@/lib/entregas";
import type { Order } from "../types";

interface Props {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFeito: () => void;
  /** Abre o cancelamento (reversão controlada) para quando a entrega não aconteceu. */
  onCancelar: (orderId: string) => void;
}

/**
 * Regularização administrativa de registro antigo: só o administrador, com motivo e histórico.
 * Não presume preço, pagamento, entrega realizada nem estoque; não vincula entregador por nome.
 */
export function RegularizarDialog({ order, isOpen, onOpenChange, onFeito, onCancelar }: Props) {
  const { data: entregadores = [] } = useEntregadoresApp();
  const [modo, setModo] = useState<"fila" | "atribuir">("fila");
  const [entregador, setEntregador] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("regularizar");
  const qc = useQueryClient();
  const { toast } = useToast();
  useEffect(() => { if (isOpen) { setModo("fila"); setEntregador(""); setMotivo(""); setErro(null); } }, [isOpen, order?.id]);

  const pode = !!order && motivo.trim().length >= 5 && (modo === "fila" || !!entregador) && !operacao.enviando;
  const enviar = async () => {
    if (!order || !pode) return;
    setErro(null);
    const alvo = modo === "atribuir" ? entregador : null;
    try {
      await operacao.executar({ pedido: order.id, alvo, motivo: motivo.trim() }, (chave) =>
        acao("entrega_regularizar", { _order_id: order.id, _entregador_id: alvo, _motivo: motivo.trim(), _chave: chave }));
      qc.invalidateQueries();
      toast({ title: "Registro regularizado", description: `${numeroPedido(order.id)}: ${alvo ? "atribuído, aguardando aceite" : "voltou para a fila"}. Motivo guardado no histórico.` });
      onFeito();
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível regularizar.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!operacao.enviando) onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regularizar {order ? numeroPedido(order.id) : ""}</DialogTitle>
          <DialogDescription>{order ? motivoRevisao(order) : ""}. Nada de estoque, dinheiro ou entrega é presumido.</DialogDescription>
        </DialogHeader>
        {order && (
          <div className="space-y-4 text-sm">
            <p>Registrado em {order.createdAt.toLocaleDateString("pt-BR")} · {order.clientName} · {order.quantity}× {order.product}
              {order.deliveryPersonName ? ` · entregador anotado: ${order.deliveryPersonName}` : ""}</p>
            <RadioGroup value={modo} onValueChange={(v) => setModo(v as "fila" | "atribuir")} className="space-y-2">
              <label className="flex items-start gap-2"><RadioGroupItem value="fila" id="reg-fila" />
                <span>Voltar para a fila (aguardando atribuição)</span></label>
              <label className="flex items-start gap-2"><RadioGroupItem value="atribuir" id="reg-atr" />
                <span>Atribuir a um entregador com conta no app (ele precisa aceitar)</span></label>
            </RadioGroup>
            {modo === "atribuir" && (
              <Select value={entregador} onValueChange={setEntregador}>
                <SelectTrigger aria-label="Entregador"><SelectValue placeholder="Selecione o entregador" /></SelectTrigger>
                <SelectContent>{entregadores.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <div className="space-y-2">
              <Label htmlFor="motivoRegularizar">Motivo *</Label>
              <Textarea id="motivoRegularizar" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="O que foi conferido e com quem" />
            </div>
            <p className="text-xs text-muted-foreground">Se a entrega não vai acontecer, use o cancelamento controlado em vez disto.</p>
            {erro && <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3"><p className="font-medium text-destructive">Não regularizado</p><p>{erro}</p></div>}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={operacao.enviando}>Fechar</Button>
          {order && <Button variant="outline" onClick={() => { onOpenChange(false); onCancelar(order.id); }} disabled={operacao.enviando}>Cancelar o pedido…</Button>}
          <Button onClick={enviar} disabled={!pode}>{operacao.enviando ? "Registrando…" : "Regularizar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
