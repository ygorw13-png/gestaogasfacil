import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSaldoPortariaDia, produtoLabel, type PortariaProduto } from "../../../hooks/usePortariaStock";

export interface RemainingCount {
  cheios: number;
  vazios: number;
}

export type RemainingStockMap = Record<PortariaProduto, RemainingCount>;

interface Props {
  value: RemainingStockMap;
  onChange: (value: RemainingStockMap) => void;
  /** Data do fechamento (YYYY-MM-DD) */
  date: string;
}

const PRODUCTS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

export function RemainingStockSection({ value, onChange, date }: Props) {
  const { data: saldo } = useSaldoPortariaDia(date);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Pré-preencher com o esperado (abertura do dia − vendas) enquanto o campo não foi editado
  useEffect(() => {
    if (!saldo) return;
    const next: RemainingStockMap = { ...value };
    let changed = false;
    PRODUCTS.forEach((p) => {
      if (!touched[`${p}-cheios`] && next[p].cheios !== saldo[p].esperado_cheios) {
        next[p] = { ...next[p], cheios: saldo[p].esperado_cheios };
        changed = true;
      }
      if (!touched[`${p}-vazios`] && next[p].vazios !== saldo[p].esperado_vazios) {
        next[p] = { ...next[p], vazios: saldo[p].esperado_vazios };
        changed = true;
      }
    });
    if (changed) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saldo]);

  const handle = (p: PortariaProduto, field: keyof RemainingCount, raw: string) => {
    const n = Math.max(0, parseInt(raw || "0", 10) || 0);
    setTouched((t) => ({ ...t, [`${p}-${field}`]: true }));
    onChange({ ...value, [p]: { ...value[p], [field]: n } });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Package className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Contagem de estoque final</h4>
          <span className="text-xs text-muted-foreground">
            (base: quantidade confirmada na abertura do dia − vendas)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRODUCTS.map((p) => {
            const abertura = saldo?.[p].abertura_cheios ?? 0;
            const vendas = saldo?.[p].vendas_dia ?? 0;
            const esperadoCheios = saldo?.[p].esperado_cheios ?? 0;
            const esperadoVazios = saldo?.[p].esperado_vazios ?? 0;
            const emprestados = saldo?.[p].emprestados ?? 0;
            const divCheios = value[p].cheios - esperadoCheios;
            const divVazios = value[p].vazios - esperadoVazios;
            const hasDivergence = divCheios !== 0 || divVazios !== 0;

            return (
              <div key={p} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{produtoLabel(p)}</span>
                  {hasDivergence ? (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> Divergência
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ok
                    </Badge>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Abertura: {abertura} · Vendas: {vendas} · Esperado: {esperadoCheios}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Cheios restantes</Label>
                    <Input
                      type="number"
                      min={0}
                      value={value[p].cheios}
                      onChange={(e) => handle(p, "cheios", e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Esperado: {esperadoCheios}
                      {divCheios !== 0 && (
                        <span className={divCheios > 0 ? "text-emerald-600 ml-1" : "text-destructive ml-1"}>
                          ({divCheios > 0 ? "+" : ""}{divCheios})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Vazios restantes</Label>
                    <Input
                      type="number"
                      min={0}
                      value={value[p].vazios}
                      onChange={(e) => handle(p, "vazios", e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Esperado: {esperadoVazios}
                      {divVazios !== 0 && (
                        <span className={divVazios > 0 ? "text-emerald-600 ml-1" : "text-destructive ml-1"}>
                          ({divVazios > 0 ? "+" : ""}{divVazios})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {emprestados > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    {emprestados} casco(s) emprestado(s) em aberto
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export const emptyRemainingStock = (): RemainingStockMap => ({
  P13: { cheios: 0, vazios: 0 },
  P20: { cheios: 0, vazios: 0 },
  P45: { cheios: 0, vazios: 0 },
  agua: { cheios: 0, vazios: 0 },
});
