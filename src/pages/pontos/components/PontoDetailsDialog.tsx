import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MapPin, Package, HandCoins } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useLancamentosConta, useSaldosConta } from "@/hooks/useContaBotijoes";
import { PagamentoContaDialog } from "@/components/conta/PagamentoContaDialog";
import type { PontoRevenda } from "@/hooks/usePontosRevenda";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ponto: PontoRevenda | null;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PontoDetailsDialog({ open, onOpenChange, ponto }: Props) {
  const { saldos } = useSaldosConta("ponto");
  const { data: lancamentos } = useLancamentosConta("ponto", ponto?.id);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);

  if (!ponto) return null;
  const saldo = saldos.find((s) => s.parceiro_id === ponto.id);
  const devidos = saldo?.botijoes_devidos ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ponto.nome}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-3">
              {ponto.povoado && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ponto.povoado}
                </span>
              )}
              {ponto.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {ponto.telefone}
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
                <p className="text-xs text-muted-foreground">Vasilhames emprestados</p>
                <p className="text-2xl font-bold">{ponto.vasilhames_emprestados}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Trabalha com</p>
                <p className="text-2xl font-bold">{ponto.media_botijoes}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPagamentoOpen(true)} disabled={devidos <= 0}>
              <HandCoins className="mr-2 h-4 w-4" /> Lançar pagamento
            </Button>
            {ponto.telefone && (
              <WhatsAppButton
                phone={ponto.telefone}
                message={`Olá ${ponto.nome}! Aqui é da distribuidora. Vamos passar aí na rota, precisa de gás?`}
                label="WhatsApp"
              />
            )}
          </div>

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
                    <td className="p-2">{new Date(`${l.data}T00:00:00`).toLocaleDateString("pt-BR")}</td>
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
        </DialogContent>
      </Dialog>

      <PagamentoContaDialog
        open={pagamentoOpen}
        onOpenChange={setPagamentoOpen}
        parceiroTipo="ponto"
        parceiroId={ponto.id}
        parceiroNome={ponto.nome}
        botijoesDevidos={devidos}
      />
    </>
  );
}
