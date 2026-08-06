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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Order } from "../types";

const PAYMENTS = [
  { value: "money", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit", label: "Cartão de Crédito" },
  { value: "debit", label: "Cartão de Débito" },
  { value: "convenio", label: "Convênio" },
  { value: "gas-povo", label: "Gás-Povo" },
  { value: "vale-gas", label: "Vale-Gás" },
  { value: "promissoria", label: "Nota Promissória" },
];

const paymentLabel = (v?: string) =>
  PAYMENTS.find((p) => p.value === v)?.label || v || "não informada";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface CompleteOrderPayload {
  paymentMethod: string;
  receivedValue: number;
  divergenceReason?: string;
}

interface CompleteOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  onSubmit: (payload: CompleteOrderPayload) => void;
}

export function CompleteOrderDialog({
  isOpen,
  onOpenChange,
  order,
  onSubmit,
}: CompleteOrderDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [reason, setReason] = useState("");

  const expectedValue = Number(order?.price || 0);
  const expectedPayment = order?.paymentMethod || "";

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(expectedPayment || "");
      setValue(expectedValue ? String(expectedValue).replace(".", ",") : "");
      setReason("");
    }
  }, [isOpen, expectedPayment, expectedValue]);

  const received = Number((value || "").replace(",", "."));
  const valueDiffers = expectedValue > 0 && !!received && Math.abs(received - expectedValue) > 0.009;
  const paymentDiffers = !!expectedPayment && !!paymentMethod && paymentMethod !== expectedPayment;
  const hasDivergence = valueDiffers || paymentDiffers;
  const reasonMissing = hasDivergence && reason.trim().length < 5;

  const handleSubmit = () => {
    if (!paymentMethod || !received || received <= 0 || reasonMissing) return;
    onSubmit({
      paymentMethod,
      receivedValue: received,
      divergenceReason: hasDivergence ? reason.trim() : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Entrega</DialogTitle>
          <DialogDescription>
            {expectedValue > 0 || expectedPayment
              ? `Pedido: ${formatBRL(expectedValue)} • ${paymentLabel(expectedPayment)}`
              : "Confirme os detalhes da entrega concluída."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento recebida</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENTS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedValue">Valor recebido (R$)</Label>
            <Input
              id="receivedValue"
              inputMode="decimal"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          {hasDivergence && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {valueDiffers && (
                  <>
                    Valor divergente: pedido {formatBRL(expectedValue)} × recebido {formatBRL(received)} (
                    {received > expectedValue ? "+" : ""}
                    {formatBRL(received - expectedValue)}).
                  </>
                )}
                {valueDiffers && paymentDiffers && <br />}
                {paymentDiffers && (
                  <>
                    Pagamento divergente: pedido {paymentLabel(expectedPayment)} × recebido{" "}
                    {paymentLabel(paymentMethod)}.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {hasDivergence && (
            <div className="space-y-2">
              <Label htmlFor="reason">Justificativa da divergência *</Label>
              <Textarea
                id="reason"
                placeholder="Explique por que o valor/forma de pagamento foi diferente do pedido"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {reasonMissing && (
                <p className="text-xs text-destructive">
                  Descreva o motivo (mínimo 5 caracteres) para concluir a entrega.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!paymentMethod || !received || received <= 0 || reasonMissing}
          >
            Confirmar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
