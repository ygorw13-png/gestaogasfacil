import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Package,
  Wallet,
  Truck,
  FileWarning,
  ArrowRight,
  Store,
} from "lucide-react";
import { useSaldoPortaria, produtoLabel } from "@/pages/entrance/hooks/usePortariaStock";
import { useAlertasPontos } from "@/hooks/usePontosRevenda";
import {
  useConferenciaHoje,
  useMarcarConferencia,
  useFechamentoOntem,
  usePromissoriasVencidas,
  useRotasHoje,
} from "./hooks/usePainelDoDia";
import { TarefasMensaisCard } from "./components/TarefasMensaisCard";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PainelDoDia() {
  const navigate = useNavigate();
  const { data: saldo, isLoading: loadingSaldo } = useSaldoPortaria();
  const { data: conferencia } = useConferenciaHoje();
  const marcar = useMarcarConferencia();
  const { data: fechamento } = useFechamentoOntem();
  const { data: vencidas } = usePromissoriasVencidas();
  const { data: rotas } = useRotasHoje();
  const { alertas } = useAlertasPontos();

  const pontosUrgentes = alertas.filter((a) => a.urgencia !== "ok");
  const totalVencido = (vencidas ?? []).reduce((s, n) => s + n.value, 0);

  const tarefas = [
    { done: !!conferencia?.estoque_ok, label: "Conferir estoque" },
    { done: !!conferencia?.caixa_ok, label: "Conferir caixa de ontem" },
    { done: !!conferencia?.rotas_ok, label: "Definir rotas do dia" },
  ];
  const pendentes = tarefas.filter((t) => !t.done).length;

  return (
    <div className="space-y-6 animate-in pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Dia</h1>
        <p className="text-sm text-muted-foreground">
          {pendentes === 0
            ? "Tudo conferido por hoje. Bom trabalho!"
            : `${pendentes} tarefa(s) pendente(s) para começar o dia.`}
        </p>
      </div>

      <TarefasMensaisCard />

      {/* 1. Estoque */}
      <Card className={conferencia?.estoque_ok ? "border-emerald-500/50" : "border-primary/40"}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> 1. Conferir estoque
            </CardTitle>
            <CardDescription>Confira o saldo físico de cheios e vazios da portaria.</CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!conferencia?.estoque_ok}
              onCheckedChange={(v) => marcar.mutate({ estoque_ok: !!v })}
            />
            Está ok
          </label>
        </CardHeader>
        <CardContent>
          {loadingSaldo || !saldo ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              {Object.values(saldo).map((s) => (
                <div key={s.produto} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{produtoLabel(s.produto)}</p>
                  <p className="text-xl font-bold">{s.cheios} cheios</p>
                  <p className="text-xs text-muted-foreground">
                    {s.vazios} vazios · {s.emprestados} emprestados
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button variant="link" className="px-0" onClick={() => navigate("/inventory")}>
            Abrir estoque <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* 2. Caixa de ontem */}
      <Card className={conferencia?.caixa_ok ? "border-emerald-500/50" : "border-primary/40"}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" /> 2. Caixa da portaria (ontem)
            </CardTitle>
            <CardDescription>
              {fechamento
                ? `${new Date(`${fechamento.data}T00:00:00`).toLocaleDateString("pt-BR")} · ${
                    fechamento.movimentos
                  } movimentações`
                : "Carregando..."}
            </CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!conferencia?.caixa_ok}
              onCheckedChange={(v) => marcar.mutate({ caixa_ok: !!v })}
            />
            Está ok
          </label>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-bold">{brl(fechamento?.totalDinheiro ?? 0)}</p>
          {fechamento && !fechamento.temFechamento && (
            <Badge variant="destructive">Fechamento não registrado</Badge>
          )}
          <div>
            <Button variant="link" className="px-0" onClick={() => navigate("/entrance")}>
              Ver histórico da portaria <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Rotas */}
      <Card className={conferencia?.rotas_ok ? "border-emerald-500/50" : "border-primary/40"}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" /> 3. Rotas do dia
            </CardTitle>
            <CardDescription>
              {(rotas?.length ?? 0) === 0
                ? "Nenhuma rota programada para hoje."
                : `${rotas?.length} rota(s) programada(s).`}
            </CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!conferencia?.rotas_ok}
              onCheckedChange={(v) => marcar.mutate({ rotas_ok: !!v })}
            />
            Está ok
          </label>
        </CardHeader>
        <CardContent className="space-y-3">
          {pontosUrgentes.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Store className="h-4 w-4" /> {pontosUrgentes.length} ponto(s) de revenda
                precisando de reposição
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {pontosUrgentes.slice(0, 5).map((a) => (
                  <li key={a.ponto.id} className="flex justify-between gap-2">
                    <span>
                      {a.ponto.nome}
                      {a.ponto.povoado ? ` — ${a.ponto.povoado}` : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {a.diasSemEntrega === null
                        ? "sem entregas"
                        : `há ${a.diasSemEntrega} dia(s)`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="link" className="px-0" onClick={() => navigate("/routes")}>
              Abrir rotas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="link" className="px-0" onClick={() => navigate("/pontos-revenda")}>
              Pontos de revenda <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Promissórias vencidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileWarning className="h-5 w-5" /> Promissórias vencidas
          </CardTitle>
          <CardDescription>
            {(vencidas?.length ?? 0)} nota(s) em atraso · {brl(totalVencido)} a cobrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(vencidas ?? []).length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Nenhuma promissória vencida.
            </p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2 text-left">Vencimento</th>
                    <th className="p-2 text-right">Atraso</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {(vencidas ?? []).slice(0, 8).map((n) => (
                    <tr key={n.id} className="border-t">
                      <td className="p-2">{n.client_name}</td>
                      <td className="p-2">
                        {new Date(`${n.due_date}T00:00:00`).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-2 text-right text-destructive">{n.diasAtraso} dia(s)</td>
                      <td className="p-2 text-right font-medium">{brl(n.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Button variant="link" className="px-0" onClick={() => navigate("/promissory")}>
            Abrir promissórias <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Button variant="secondary" onClick={() => navigate("/dashboard")}>
        Ver dashboard completo
      </Button>
    </div>
  );
}
