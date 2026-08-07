import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import {
  useTarefasMensais,
  useMarcarTarefaMensal,
  dentroJanelaFiscal,
  competenciaAtual,
} from "@/hooks/useTarefasMensais";

const itens = [
  { key: "boletos_ok", label: "Emitir boletos" },
  { key: "notas_fiscais_ok", label: "Emitir notas fiscais" },
  { key: "contabilidade_ok", label: "Enviar arquivos à contabilidade" },
] as const;

export function TarefasMensaisCard() {
  const { data } = useTarefasMensais();
  const marcar = useMarcarTarefaMensal();

  if (!dentroJanelaFiscal()) return null;

  const pendentes = itens.filter((i) => !data?.[i.key]).length;
  const diasRestantes = 10 - new Date().getDate();
  const competenciaLabel = new Date(`${competenciaAtual()}-01T00:00:00`).toLocaleDateString(
    "pt-BR",
    { month: "long", year: "numeric" }
  );

  return (
    <Card className={pendentes === 0 ? "border-emerald-500/50" : "border-amber-500/60"}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Obrigações do mês ({competenciaLabel})
          </CardTitle>
          <CardDescription>
            Prazo até o dia 10 · {diasRestantes === 0 ? "último dia!" : `${diasRestantes} dia(s) restante(s)`}
          </CardDescription>
        </div>
        {pendentes === 0 ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600">Concluído</Badge>
        ) : (
          <Badge variant="destructive">{pendentes} pendente(s)</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {itens.map((i) => (
          <label key={i.key} className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={!!data?.[i.key]}
              onCheckedChange={(v) => marcar.mutate({ [i.key]: !!v } as any)}
            />
            <span className={data?.[i.key] ? "text-muted-foreground line-through" : ""}>
              {i.label}
            </span>
          </label>
        ))}
        {data?.conferido_por_nome && (
          <p className="text-xs text-muted-foreground">Última atualização por {data.conferido_por_nome}</p>
        )}
      </CardContent>
    </Card>
  );
}
