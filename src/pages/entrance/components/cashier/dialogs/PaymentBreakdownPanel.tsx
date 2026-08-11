import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useResumoPagamentos } from "../../../hooks/useResumoPagamentos";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  /** Data do fechamento (YYYY-MM-DD) */
  date: string;
}

/** Painel compacto com a quantidade e o valor vendido por categoria de pagamento. */
export function PaymentBreakdownPanel({ date }: Props) {
  const { categorias, totalQtd, totalValor, isLoading } = useResumoPagamentos(date);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Vendas por categoria de pagamento</h4>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : categorias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda registrada nesta data.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categorias.map((c) => (
              <div key={c.key} className="rounded-md border p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="text-sm font-semibold">{c.quantidade}</span>
                </div>
                <div className="text-xs text-muted-foreground">{brl(c.valor)}</div>
                {c.valorAgua > 0 && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Gás {brl(c.valorGas)} · Água {brl(c.valorAgua)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between border-t pt-2 text-sm font-medium">
          <span>Total ({totalQtd} itens)</span>
          <span>{brl(totalValor)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
