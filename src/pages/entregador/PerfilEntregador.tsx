import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Timer, Target, Flame, Package, DollarSign, Star } from "lucide-react";
import { useEntregadorStats } from "@/hooks/useEntregadorStats";
import { useUserRole } from "@/hooks/useUserRole";

const METAS = [
  { label: "5 entregas hoje", key: "entregasHoje", alvo: 5 },
  { label: "80 entregas no mês", key: "entregasMes", alvo: 80 },
  { label: "Tempo médio até 25 min", key: "tempoMedioInverso", alvo: 25 },
  { label: "90% das entregas no prazo", key: "pontualidade", alvo: 90 },
  { label: "7 dias seguidos entregando", key: "sequencia", alvo: 7 },
];

export default function PerfilEntregador() {
  const { data, isLoading } = useEntregadorStats();
  const { name } = useUserRole();

  if (isLoading || !data) {
    return <p className="py-10 text-center text-muted-foreground">Carregando seu desempenho...</p>;
  }

  const valorMeta = (key: string) => {
    if (key === "tempoMedioInverso") {
      // quanto menor o tempo, maior o progresso
      return data.tempoMedio === 0 ? 0 : Math.min(100, Math.round((25 / data.tempoMedio) * 100));
    }
    const alvo = METAS.find((m) => m.key === key)!.alvo;
    return Math.min(100, Math.round((Number((data as any)[key] ?? 0) / alvo) * 100));
  };

  return (
    <div className="space-y-4 pb-24">
      <Card className="border-primary border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" /> {name ?? "Entregador"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">Nível {data.nivel}</p>
              <Badge variant="secondary" className="mt-1">
                <Star className="mr-1 h-3 w-3" /> {data.titulo}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Pontos</p>
              <p className="text-xl font-bold">{data.xp}</p>
            </div>
          </div>
          <div>
            <Progress value={data.progresso} />
            <p className="mt-1 text-xs text-muted-foreground">
              Faltam {data.xpProximo - data.xpNivel} pontos para o nível {data.nivel + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Card><CardContent className="p-3 text-center">
          <Package className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Entregas hoje</p>
          <p className="text-xl font-bold">{data.entregasHoje}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Package className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No mês</p>
          <p className="text-xl font-bold">{data.entregasMes}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Timer className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Tempo médio</p>
          <p className="text-xl font-bold">{data.tempoMedio} min</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Target className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No prazo</p>
          <p className="text-xl font-bold">{data.pontualidade}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Flame className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Dias seguidos</p>
          <p className="text-xl font-bold">{data.sequencia}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <DollarSign className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Vendido no mês</p>
          <p className="text-xl font-bold">R$ {data.faturadoMes.toFixed(0)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Metas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {METAS.map((m) => {
            const pct = valorMeta(m.key);
            return (
              <div key={m.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{m.label}</span>
                  <span className={pct >= 100 ? "font-semibold text-primary" : "text-muted-foreground"}>
                    {pct >= 100 ? "Concluída ✅" : `${pct}%`}
                  </span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Cada entrega vale 10 pontos e entregas feitas em até 30 minutos valem 5 pontos extras.
      </p>
    </div>
  );
}
