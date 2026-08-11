import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Wallet } from "lucide-react";
import { useResumoPagamentos } from "../../../hooks/useResumoPagamentos";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  /** Data do fechamento (YYYY-MM-DD) */
  date: string;
}

/**
 * Conferência de valores separada por categoria (Dinheiro, PIX, Cartão).
 * As demais formas de pagamento entram apenas como conferência de quantidade.
 */
export function ValueConferenceSection({ date }: Props) {
  const { conferiveis, outras, agregados, totalAgregadosQtd, totalAgregadosValor } =
    useResumoPagamentos(date);
  const [conferido, setConferido] = useState<Record<string, string>>({});

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Conferência por categoria</h4>
        </div>

        {conferiveis.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum recebimento em dinheiro, PIX ou cartão nesta data.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {conferiveis.map((c) => {
            const raw = conferido[c.key];
            const valor = raw === undefined || raw === "" ? c.valor : Number(raw.replace(",", ".")) || 0;
            const dif = valor - c.valor;
            return (
              <div key={c.key} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.label}</span>
                  {dif === 0 ? (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ok
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> {dif > 0 ? "Sobra" : "Falta"}
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Sistema: <span className="font-medium text-foreground">{brl(c.valor)}</span> ·{" "}
                  {c.quantidade} item(ns)
                </div>
                {c.key === "money" && (
                  <div className="text-[11px] text-muted-foreground">
                    Gás {brl(c.valorGas)} · Água {brl(c.valorAgua)}
                  </div>
                )}

                <div>
                  <Label className="text-xs">Valor conferido</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={raw ?? String(c.valor.toFixed(2))}
                    onChange={(e) => setConferido((s) => ({ ...s, [c.key]: e.target.value }))}
                    className="text-right"
                  />
                </div>

                {dif !== 0 && (
                  <p className={`text-xs font-medium ${dif > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {dif > 0 ? "Sobra" : "Falta"} de {brl(Math.abs(dif))}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {agregados.length > 0 && (
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-xs font-medium">Agregados (revendedores)</p>
            <div className="flex flex-wrap gap-2">
              {agregados.map((c) => (
                <Badge key={c.key} variant="outline" className="text-xs">
                  {c.label}: {c.quantidade} · {brl(c.valor)}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between border-t pt-2 text-xs font-medium">
              <span>Total agregados ({totalAgregadosQtd} itens)</span>
              <span>{brl(totalAgregadosValor)}</span>
            </div>
          </div>
        )}

        {outras.length > 0 && (
          <div className="rounded-md border p-3">
            <p className="text-xs font-medium mb-2">
              Outras formas — conferir apenas a quantidade de produtos
            </p>
            <div className="flex flex-wrap gap-2">
              {outras.map((c) => (
                <Badge key={c.key} variant="outline" className="text-xs">
                  {c.label}: {c.quantidade}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
