import { AlertTriangle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlertasPontos } from "@/hooks/usePontosRevenda";

const CORES = {
  urgente: "destructive",
  atencao: "default",
  ok: "secondary",
} as const;

const ROTULO = {
  urgente: "Reabastecer já",
  atencao: "Programar rota",
  ok: "Em dia",
} as const;

export function AlertasPontosCard() {
  const { alertas, isLoading } = useAlertasPontos();

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (alertas.length === 0) return null;

  const prioritarios = alertas.filter((a) => a.urgencia !== "ok");
  if (prioritarios.length === 0) return null;

  return (
    <Card className="border-amber-500/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Pontos de revenda que precisam de rota
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {prioritarios.map((a) => (
          <div
            key={a.ponto.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{a.ponto.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {a.ponto.povoado ?? "Sem povoado"} ·{" "}
                  {a.diasSemEntrega !== null
                    ? `${a.diasSemEntrega} dias sem entrega`
                    : "sem entregas registradas"}
                  {a.botijoesDevidos > 0 && ` · ${a.botijoesDevidos} botijões a acertar`}
                </p>
              </div>
            </div>
            <Badge variant={CORES[a.urgencia]}>{ROTULO[a.urgencia]}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
