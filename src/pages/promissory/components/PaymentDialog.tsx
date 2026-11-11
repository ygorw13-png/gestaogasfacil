
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromissoryNote } from "../types";
import type { Cobrador } from "../hooks/useCollectors";
import { useOperacaoUnica } from "@/hooks/useOperacaoUnica";
import { G1_ACOES, formaRecebimento } from "@/lib/g1/acoes";

const paymentMethods = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência Bancária"
];

const PORTARIA = "__portaria__";
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolve após a gravação confirmada; rejeita com o motivo. */
  onSubmit: (amount: number, method: string, opts: { chave: string; cobrador?: Cobrador | null }) => Promise<void> | void;
  noteId: string | null;
  notes: PromissoryNote[];
  collectors?: Cobrador[];
}

/**
 * Recebimento de promissória (parcial ou total). É recebimento de uma venda anterior, não venda nova.
 * Começa com o SALDO restante (não o valor original). Fecha só depois da gravação confirmada; em falha
 * mantém os dados e, se a resposta se perdeu, não permite reenviar outro valor com a mesma chave.
 */
export function PaymentDialog({
  open,
  onOpenChange,
  onSubmit,
  noteId,
  notes,
  collectors = [],
}: PaymentDialogProps) {
  const [paymentValue, setPaymentValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [recebidoPor, setRecebidoPor] = useState<string>(PORTARIA);
  const [erro, setErro] = useState<string | null>(null);
  const operacao = useOperacaoUnica("receber-prom");
  const note = notes.find((n) => n.id === noteId);

  useEffect(() => {
    if (open && note) {
      setPaymentValue(note.saldo.toFixed(2));
      setPaymentMethod("");
      setRecebidoPor(note.cobradorId && collectors.some((c) => c.id === note.cobradorId) ? note.cobradorId : PORTARIA);
      setErro(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, noteId]);

  const amount = parseFloat(paymentValue);
  const semRegra = G1_ACOES && !!paymentMethod && !["dinheiro", "pix", "cartao"].includes(formaRecebimento(paymentMethod) ?? "");
  const acimaDoSaldo = !!note && amount > note.saldo + 0.0001;
  const invalido = !note || !paymentMethod || isNaN(amount) || amount <= 0 || acimaDoSaldo || semRegra;
  const ehDinheiro = formaRecebimento(paymentMethod) === "dinheiro";

  const handleSubmit = async () => {
    if (invalido || operacao.enviando || !note) return;
    setErro(null);
    const cobrador = ehDinheiro && recebidoPor !== PORTARIA ? collectors.find((c) => c.id === recebidoPor) ?? null : null;
    try {
      await operacao.executar({ nota: note.id, valor: amount, forma: paymentMethod, cobrador: cobrador?.id ?? null }, (chave) =>
        Promise.resolve(onSubmit(amount, paymentMethod, { chave, cobrador })));
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Recebimento não registrado. Os dados foram mantidos.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !operacao.enviando && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar recebimento</DialogTitle>
          <DialogDescription>
            {note
              ? `${note.clientName} — valor ${brl(note.value)}, já recebido ${brl(note.paidAmount)}, saldo ${brl(note.saldo)}.`
              : "Informe os detalhes do pagamento recebido."}
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={operacao.enviando} className="space-y-4 py-4 border-0 m-0 min-w-0">
          <div className="space-y-2">
            <Label htmlFor="value">Valor recebido agora</Label>
            <Input
              id="value"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={paymentValue}
              onChange={(e) => setPaymentValue(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
              className="col-span-3"
            />
            <p className={`text-xs ${acimaDoSaldo ? "text-destructive" : "text-muted-foreground"}`}>
              {acimaDoSaldo ? "Maior que o saldo restante." : "Pode ser parcial: o saldo restante continua em aberto."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {semRegra && (
              <p className="text-xs text-destructive">Esta forma ainda não tem regra de recebimento (destino do valor a decidir).</p>
            )}
          </div>
          {ehDinheiro && (
            <div className="space-y-2">
              <Label>Quem recebeu o dinheiro</Label>
              <Select value={recebidoPor} onValueChange={setRecebidoPor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={PORTARIA}>Recebido na portaria (entra no caixa)</SelectItem>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>Cobrador: {c.nome} (fica com ele até prestar contas)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!ehDinheiro && paymentMethod && !semRegra && (
            <p className="text-xs text-muted-foreground">PIX e cartão: o destino do valor ainda não foi definido; o recebimento fica registrado como informado.</p>
          )}
        </fieldset>
        {erro && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Recebimento não registrado</p>
            <p>{erro}</p>
            {operacao.duvida && (
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => { operacao.descartarDuvida(); setErro(null); }}>
                Descartar a tentativa anterior e registrar como novo recebimento
              </Button>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={operacao.enviando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={invalido || operacao.enviando}>
            {operacao.enviando ? "Registrando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
