import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingCart } from "lucide-react";
import { useSalesHistory } from "../../../hooks/useSalesHistory";
import { EditSaleButton } from "../../sales/EditSaleButton";
import { CancelSaleButton } from "../../sales/CancelSaleButton";
import { SaleFormContent } from "../../sale-form/SaleFormContent";
import { useCashier } from "@/contexts/CashierContext";

import { RegisterSaleButton } from "@/pages/entrance/components/sale-form/RegisterSaleButton";
const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface ClosingSalesEditorProps {
  /** Data do fechamento no formato YYYY-MM-DD */
  date: string;
}

/** Lista as vendas da data do fechamento permitindo lançar, editar e cancelar antes de fechar. */
export function ClosingSalesEditor({ date }: ClosingSalesEditorProps) {
  const dateObj = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const { data: sales = [], isLoading } = useSalesHistory(dateObj, dateObj);
  const { handleNewSaleSubmit } = useCashier();
  const [novaVendaOpen, setNovaVendaOpen] = useState(false);

  const ativas = sales.filter((s) => s.status !== "cancelled");
  const total = ativas.reduce((acc, s) => acc + s.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Vendas do dia ({ativas.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total {formatBRL(total)} — ajuste antes de confirmar o fechamento.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setNovaVendaOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Lançar venda
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Carregando vendas...</p>
        ) : sales.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Nenhuma venda registrada nesta data.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Hora</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Produto</th>
                  <th className="px-3 py-2 text-center font-medium">Qtd</th>
                  <th className="px-3 py-2 font-medium">Pagamento</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">{s.time}</td>
                    <td className="px-3 py-2">{s.client}</td>
                    <td className="px-3 py-2">{s.product}</td>
                    <td className="px-3 py-2 text-center">{s.quantity}</td>
                    <td className="px-3 py-2">{s.payment}</td>
                    <td className="px-3 py-2 text-right">{s.valorInformado ? formatBRL(s.amount) : <span className="text-muted-foreground">Não informado</span>}</td>
                    <td className="px-3 py-2">
                      {s.status === "cancelled" ? (
                        <div className="flex justify-end">
                          <Badge variant="destructive">Cancelada</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <EditSaleButton
                            saleId={s.id}
                            client={s.client}
                            product={s.product}
                            quantity={s.quantity}
                            amount={s.amount}
                            paymentCode={s.paymentCode}
                          />
                          <CancelSaleButton
                            saleId={s.id}
                            client={s.client}
                            product={s.product}
                            quantity={s.quantity}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={novaVendaOpen} onOpenChange={setNovaVendaOpen}>
        <DialogContent
          className="sm:max-w-[700px]"
          onSubmit={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              Lançar venda em {date.split("-").reverse().join("/")}
            </DialogTitle>
          </DialogHeader>
          <SaleFormContent
            onSubmit={(sale) => handleNewSaleSubmit(sale, date)}
            onOpenChange={setNovaVendaOpen}
          />
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setNovaVendaOpen(false)}>
              Cancelar
            </Button>
            <RegisterSaleButton />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
