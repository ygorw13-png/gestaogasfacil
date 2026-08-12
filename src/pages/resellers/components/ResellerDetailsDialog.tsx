import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin, User, Package, HandCoins } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useLancamentosConta, useSaldosConta } from "@/hooks/useContaBotijoes";
import { PagamentoContaDialog } from "@/components/conta/PagamentoContaDialog";
import { Reseller } from "../types";
import { format } from "date-fns";

interface ResellerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: Reseller | null;
  canViewPrices: boolean;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ResellerDetailsDialog({
  open,
  onOpenChange,
  reseller,
  canViewPrices,
}: ResellerDetailsDialogProps) {
  const { saldos } = useSaldosConta("agregado");
  const { data: lancamentos } = useLancamentosConta("agregado", reseller?.id);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);

  if (!reseller) return null;

  const saldo = saldos.find((s) => s.parceiro_id === reseller.id);
  const devidos = saldo?.botijoes_devidos ?? 0;
  const recebido = saldo?.valor_recebido ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{reseller.name}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-3">
              {reseller.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {reseller.phone}
                </span>
              )}
              {reseller.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {reseller.address}
                </span>
              )}
              {reseller.contactPerson && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {reseller.contactPerson}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Botijões em aberto</p>
                <p className="text-2xl font-bold">{devidos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total recebido</p>
                <p className="text-2xl font-bold">{brl(recebido)}</p>
              </CardContent>
            </Card>
            {canViewPrices && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Preço P13</p>
                  <p className="text-2xl font-bold">
                    {reseller.priceP13 > 0 ? brl(reseller.priceP13) : "—"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPagamentoOpen(true)} disabled={devidos <= 0}>
              <HandCoins className="mr-2 h-4 w-4" /> Lançar acerto
            </Button>
            {reseller.phone && (
              <WhatsAppButton
                phone={reseller.phone}
                message={`Olá ${reseller.name}! Aqui é da distribuidora. Vamos acertar os botijões?`}
                label="WhatsApp"
              />
            )}
          </div>

          {reseller.notes && (
            <p className="text-sm text-muted-foreground">{reseller.notes}</p>
          )}

          <div>
            <h4 className="mb-2 text-sm font-medium">Histórico</h4>
            <div className="max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-right">Qtd</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {(lancamentos ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        Nenhum lançamento ainda.
                      </td>
                    </tr>
                  )}
                  {(lancamentos ?? []).map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-2">
                        {new Date(`${l.data}T00:00:00`).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-2">
                        <Badge variant={l.tipo === "pagamento" ? "default" : "secondary"}>
                          {l.tipo === "entrega" ? "Entrega" : l.tipo === "pagamento" ? "Pagamento" : "Ajuste"}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" /> {l.quantidade}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {l.valor_total ? brl(Number(l.valor_total)) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Cadastrado em {format(new Date(reseller.createdAt), "dd/MM/yyyy")}
          </p>
        </DialogContent>
      </Dialog>

      <PagamentoContaDialog
        open={pagamentoOpen}
        onOpenChange={setPagamentoOpen}
        parceiroTipo="agregado"
        parceiroId={reseller.id}
        parceiroNome={reseller.name}
        botijoesDevidos={devidos}
      />
    </>
  );
}
