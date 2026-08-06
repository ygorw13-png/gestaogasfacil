import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  useMovimentacoesPeriodo,
  resumirPorDia,
  divergenciasPorOperador,
  saldoFinalDoDia,
} from "./hooks/usePortariaHistorico";
import { produtoLabel, tipoLabel, type PortariaProduto } from "./hooks/usePortariaStock";

const PRODUTOS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function HistoricoPortaria() {
  const [dia, setDia] = useState(todayStr());
  const [inicio, setInicio] = useState(format(subDays(new Date(), 13), "yyyy-MM-dd"));
  const [fim, setFim] = useState(todayStr());

  const { data: movsPeriodo, isLoading } = useMovimentacoesPeriodo(inicio, fim);
  const { data: movsDia, isLoading: loadingDia } = useMovimentacoesPeriodo(dia, dia);

  const resumos = useMemo(() => resumirPorDia(movsPeriodo || []), [movsPeriodo]);
  const divergencias = useMemo(() => divergenciasPorOperador(movsPeriodo || []), [movsPeriodo]);
  const saldoDia = useMemo(() => saldoFinalDoDia(movsDia || []), [movsDia]);
  const resumoDia = useMemo(() => resumirPorDia(movsDia || [])[0], [movsDia]);

  const chartData = useMemo(
    () =>
      [...resumos]
        .sort((a, b) => (a.data < b.data ? -1 : 1))
        .map((r) => ({
          dia: format(parseISO(r.data), "dd/MM"),
          Vendas: r.vendas,
          Devoluções: r.devolucoes,
          Recebidos: r.recebidos,
        })),
    [resumos],
  );

  return (
    <div className="space-y-6 animate-in pb-20">
      <div>
        <h1 className="text-2xl font-bold">Histórico da Portaria</h1>
        <p className="text-sm text-muted-foreground">
          Movimentações, saldos e divergências por dia. A portaria zera diariamente e cada dia fica
          preservado aqui.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Período de análise</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={inicio} max={fim} onChange={(e) => setInicio(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comparativo dia a dia</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem movimentações no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Devoluções" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recebidos" fill="hsl(var(--accent-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Divergências por operador</CardTitle>
        </CardHeader>
        <CardContent>
          {divergencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum ajuste de divergência registrado no período.
            </p>
          ) : (
            <div className="space-y-2">
              {divergencias.map((d) => (
                <div
                  key={d.operador}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                >
                  <span className="font-medium">{d.operador}</span>
                  <div className="flex gap-3 text-xs">
                    <Badge variant="outline">{d.ocorrencias} ajuste(s)</Badge>
                    <span className={d.totalCheios < 0 ? "text-destructive" : "text-green-600"}>
                      {d.totalCheios > 0 ? "+" : ""}
                      {d.totalCheios} cheios
                    </span>
                    <span className={d.totalVazios < 0 ? "text-destructive" : "text-green-600"}>
                      {d.totalVazios > 0 ? "+" : ""}
                      {d.totalVazios} vazios
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhe de um dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Dia</Label>
              <Input type="date" value={dia} onChange={(e) => setDia(e.target.value)} className="w-40" />
            </div>
            <div className="flex gap-2 pb-1">
              <Badge variant={resumoDia?.aberturaRegistrada ? "default" : "destructive"}>
                {resumoDia?.aberturaRegistrada ? "Abertura registrada" : "Sem abertura"}
              </Badge>
              <Badge variant={resumoDia?.fechamentoRegistrado ? "default" : "outline"}>
                {resumoDia?.fechamentoRegistrado ? "Fechamento registrado" : "Sem fechamento"}
              </Badge>
            </div>
          </div>

          {loadingDia ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Vendas" value={resumoDia?.vendas ?? 0} />
                <Metric label="Devoluções" value={resumoDia?.devolucoes ?? 0} />
                <Metric label="Recebido do pátio" value={resumoDia?.recebidos ?? 0} />
                <Metric label="Enviado ao pátio" value={resumoDia?.enviados ?? 0} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PRODUTOS.map((p) => (
                  <div key={p} className="rounded-lg border p-3">
                    <div className="mb-2 text-sm font-medium">{produtoLabel(p)}</div>
                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                      <div>
                        <div className="text-lg font-bold text-primary">{saldoDia[p].cheios}</div>
                        <div className="text-muted-foreground">Cheios</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{saldoDia[p].vazios}</div>
                        <div className="text-muted-foreground">Vazios</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-amber-600">{saldoDia[p].emprestados}</div>
                        <div className="text-muted-foreground">Empr.</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Movimentações de {format(parseISO(dia), "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                {(movsDia || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma movimentação neste dia.</p>
                )}
                {(movsDia || []).map((m) => (
                  <div key={m.id} className="rounded-lg border p-3 text-sm">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{tipoLabel(m.tipo)}</Badge>
                        <span className="font-medium">{produtoLabel(m.produto)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(m.criado_em), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {m.delta_cheios !== 0 && <span>{m.delta_cheios > 0 ? "+" : ""}{m.delta_cheios} cheios</span>}
                      {m.delta_vazios !== 0 && <span>{m.delta_vazios > 0 ? "+" : ""}{m.delta_vazios} vazios</span>}
                      {m.delta_emprestados !== 0 && (
                        <span>{m.delta_emprestados > 0 ? "+" : ""}{m.delta_emprestados} emprestados</span>
                      )}
                      {m.registrado_por_nome && <span>Por: {m.registrado_por_nome}</span>}
                      {m.observacoes && <span className="italic">"{m.observacoes}"</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
