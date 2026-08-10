import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, History, RotateCcw, Package, Wrench } from "lucide-react";
import {
  useSaldoPortaria,
  useMovimentacoesPortaria,
  produtoLabel,
  type PortariaProduto,
} from "../../hooks/usePortariaStock";
import { TransferDialog } from "./TransferDialog";
import { ReturnCylinderDialog } from "./ReturnCylinderDialog";
import { MovementsHistory } from "./MovementsHistory";
import { CorrigirEstoqueDialog } from "./CorrigirEstoqueDialog";
import { DailyAdjustmentsStrip, type AdjustmentItem } from "@/components/stock/DailyAdjustmentsStrip";

const PRODUCTS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

export function PortariaStockPanel() {
  const { data: saldo, isLoading } = useSaldoPortaria();
  const { data: movimentos } = useMovimentacoesPortaria();
  const [transferOpen, setTransferOpen] = useState<null | "in" | "out">(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);

  const ajustesHoje: AdjustmentItem[] = useMemo(
    () =>
      (movimentos || [])
        .filter((m) => m.tipo === "ajuste")
        .map((m) => ({
          id: m.id,
          at: m.criado_em,
          who: m.registrado_por_nome || "",
          label: `${produtoLabel(m.produto)}: ${[
            m.delta_cheios !== 0 ? `${m.delta_cheios > 0 ? "+" : ""}${m.delta_cheios} cheios` : null,
            m.delta_vazios !== 0 ? `${m.delta_vazios > 0 ? "+" : ""}${m.delta_vazios} vazios` : null,
            m.delta_emprestados !== 0
              ? `${m.delta_emprestados > 0 ? "+" : ""}${m.delta_emprestados} empr.`
              : null,
          ]
            .filter(Boolean)
            .join(", ")}`,
          motivo: m.observacoes,
        })),
    [movimentos]
  );


  return (
    <>
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-base">Estoque da Portaria — Hoje</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setTransferOpen("in")}>
                <ArrowDownToLine className="h-4 w-4 mr-1" />
                Receber do pátio
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTransferOpen("out")}>
                <ArrowUpFromLine className="h-4 w-4 mr-1" />
                Enviar ao pátio
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReturnOpen(true)}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Devolver vasilhame
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4 mr-1" />
                Histórico
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRODUCTS.map((p) => {
              const s = saldo?.[p];
              return (
                <div
                  key={p}
                  className="rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{produtoLabel(p)}</span>
                    {s && s.cheios < 5 && (
                      <Badge variant="destructive" className="text-[10px]">
                        Estoque baixo
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <Stat label="Cheios" value={s?.cheios ?? 0} highlight />
                    <Stat label="Vazios" value={s?.vazios ?? 0} />
                    <Stat label="Empr." value={s?.emprestados ?? 0} warning />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                    <span>Vendas: {s?.vendas_dia ?? 0}</span>
                    <span>Devoluções: {s?.devolucoes_dia ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {isLoading && (
            <p className="text-xs text-muted-foreground text-center">Carregando saldo...</p>
          )}
        </CardContent>
      </Card>

      <TransferDialog
        open={transferOpen !== null}
        direction={transferOpen ?? "in"}
        onOpenChange={(o) => !o && setTransferOpen(null)}
      />
      <ReturnCylinderDialog open={returnOpen} onOpenChange={setReturnOpen} />
      <MovementsHistory open={historyOpen} onOpenChange={setHistoryOpen} />
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
  warning,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded px-1 py-1 ${
        highlight ? "bg-primary/10" : warning ? "bg-amber-500/10" : "bg-muted/50"
      }`}
    >
      <div
        className={`text-lg font-bold leading-tight ${
          highlight ? "text-primary" : warning ? "text-amber-600 dark:text-amber-400" : ""
        }`}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}
