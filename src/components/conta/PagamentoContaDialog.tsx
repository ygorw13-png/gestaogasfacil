import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRegistrarPagamentoConta,
  type ParceiroTipo,
} from "@/hooks/useContaBotijoes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parceiroTipo: ParceiroTipo;
  parceiroId: string;
  parceiroNome: string;
  botijoesDevidos: number;
}

const FORMAS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "deposito", label: "Depósito / Transferência" },
  { value: "cartao", label: "Cartão" },
];

export function PagamentoContaDialog({
  open,
  onOpenChange,
  parceiroTipo,
  parceiroId,
  parceiroNome,
  botijoesDevidos,
}: Props) {
  const registrar = useRegistrarPagamentoConta();
  const [quantidade, setQuantidade] = useState<number>(botijoesDevidos > 0 ? botijoesDevidos : 1);
  const [preco, setPreco] = useState<string>("");
  const [forma, setForma] = useState("dinheiro");
  const [obs, setObs] = useState("");

  const precoNum = Number(preco.replace(",", ".")) || 0;
  const total = quantidade * precoNum;

  const handleSave = async () => {
    if (quantidade <= 0 || precoNum <= 0) return;
    await registrar.mutateAsync({
      parceiro_tipo: parceiroTipo,
      parceiro_id: parceiroId,
      parceiro_nome: parceiroNome,
      quantidade,
      preco_unitario: precoNum,
      forma_pagamento: forma,
      observacoes: obs || null,
    });
    setPreco("");
    setObs("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receber de {parceiroNome}</DialogTitle>
          <DialogDescription>
            Saldo atual: <strong>{botijoesDevidos}</strong> botijões em aberto. O preço é definido
            agora, no momento do recebimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qtd">Botijões pagos</Label>
              <Input
                id="qtd"
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco">Preço por botijão (R$)</Label>
              <Input
                id="preco"
                inputMode="decimal"
                placeholder="0,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            Total recebido:{" "}
            <strong>
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={registrar.isPending || precoNum <= 0}>
            Registrar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
