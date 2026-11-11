import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AVISO_CANCELAMENTO, useCancelarVenda } from "../../hooks/useCancelarVenda";
import { EditSaleButton } from "./EditSaleButton";
import { CancelSaleButton } from "./CancelSaleButton";
import { G1_ACOES } from "@/lib/g1/acoes";
import { normalizarTipoVenda } from "@/lib/saleTypes";

interface Sale {
  id: number | string;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  paymentCode?: string;
  amount: number;
  tipoVenda?: "completa" | "recarga" | "vasilhame";
  vasilhamesEntregues?: number;
  vasilhamesRecebidos?: number;
}

interface RecentSalesTableProps {
  sales: Sale[];
}

function VasilhameCell({ sale }: { sale: Sale }) {
  const entregues = sale.vasilhamesEntregues ?? 0;
  const recebidos = sale.vasilhamesRecebidos ?? 0;

  if (sale.tipoVenda === "vasilhame") {
    return <Badge variant="secondary">Só vasilhame ({entregues || sale.quantity})</Badge>;
  }
  if (normalizarTipoVenda(sale.tipoVenda) === "completa" || entregues > 0) {
    return <Badge>Com vasilhame ({entregues || sale.quantity})</Badge>;
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Troca{recebidos ? ` (${recebidos} vazio${recebidos > 1 ? "s" : ""})` : ""}
    </Badge>
  );
}


export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  const navigate = useNavigate();
  const cancelar = useCancelarVenda();
  const [alvo, setAlvo] = useState<Sale | null>(null);
  const [motivo, setMotivo] = useState("");

  const handleViewAllSales = () => {
    navigate("/entrance/history");
  };

  const confirmar = () => {
    if (!alvo || motivo.trim().length < 3) return;
    cancelar.mutate(
      { orderId: String(alvo.id), motivo: motivo.trim() },
      {
        onSuccess: () => {
          setAlvo(null);
          setMotivo("");
        },
      }
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left font-medium py-2">Horário</th>
            <th className="text-left font-medium py-2">Cliente</th>
            <th className="text-left font-medium py-2">Produto</th>
            <th className="text-center font-medium py-2">Qtd</th>
            <th className="text-left font-medium py-2">Vasilhame</th>
            <th className="text-left font-medium py-2">Pagamento</th>
            <th className="text-right font-medium py-2">Valor</th>
            <th className="text-right font-medium py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id} className="border-b">
              <td className="py-2">{sale.time}</td>
              <td className="py-2">{sale.client}</td>
              <td className="py-2">{sale.product}</td>
              <td className="py-2 text-center">{sale.quantity}</td>
              <td className="py-2"><VasilhameCell sale={sale} /></td>
              <td className="py-2">{sale.payment}</td>
              <td className="py-2 text-right">R$ {sale.amount.toFixed(2).replace('.', ',')}</td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-1">
                <EditSaleButton
                  saleId={String(sale.id)}
                  client={sale.client}
                  product={sale.product}
                  quantity={sale.quantity}
                  amount={sale.amount}
                  paymentCode={sale.paymentCode}
                />
                {G1_ACOES ? (
                  <CancelSaleButton saleId={String(sale.id)} client={sale.client} product={sale.product}
                    quantity={sale.quantity} amount={sale.amount} tipoVenda={sale.tipoVenda} />
                ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setAlvo(sale);
                    setMotivo("");
                  }}
                >
                  <Ban className="mr-1 h-4 w-4" /> Cancelar
                </Button>
                )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-center">
        <Button variant="outline" size="sm" onClick={handleViewAllSales}>
          Ver todas as vendas
        </Button>
      </div>

      <AlertDialog open={!!alvo} onOpenChange={(o) => !o && setAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda</AlertDialogTitle>
            <AlertDialogDescription>
              {alvo && (
                <>
                  {alvo.client} · {alvo.product} · {alvo.quantity} un. {AVISO_CANCELAMENTO}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo-cancelamento">Motivo do cancelamento</Label>
            <Textarea
              id="motivo-cancelamento"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: lançamento errado, cliente desistiu..."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmar();
              }}
              disabled={motivo.trim().length < 3 || cancelar.isPending}
            >
              {cancelar.isPending ? "Cancelando..." : "Confirmar cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
