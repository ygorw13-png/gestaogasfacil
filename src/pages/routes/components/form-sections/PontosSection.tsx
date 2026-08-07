import { Control, useController } from "react-hook-form";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RouteFormSchema } from "../../schemas/routeFormSchema";
import { usePontosRevenda } from "@/hooks/usePontosRevenda";

interface Props {
  control: Control<RouteFormSchema>;
}

export function PontosSection({ control }: Props) {
  const { pontos, isLoading } = usePontosRevenda();
  const { field } = useController({ control, name: "pontos" });
  const selecionados = field.value ?? [];

  const toggle = (id: string, nome: string, media: number) => {
    const existe = selecionados.find((p) => p.pontoId === id);
    if (existe) {
      field.onChange(selecionados.filter((p) => p.pontoId !== id));
    } else {
      field.onChange([...selecionados, { pontoId: id, nome, cheios: media || 0 }]);
    }
  };

  const setCheios = (id: string, cheios: number) => {
    field.onChange(
      selecionados.map((p) => (p.pontoId === id ? { ...p, cheios } : p))
    );
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando pontos...</p>;
  }

  if (pontos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum ponto de revenda cadastrado. Cadastre em Pontos de Revenda.
      </p>
    );
  }

  return (
    <FormItem>
      <FormLabel>Pontos de revenda atendidos nesta rota</FormLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        {pontos.map((p) => {
          const sel = selecionados.find((s) => s.pontoId === p.id);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!sel}
                  onCheckedChange={() => toggle(p.id, p.nome, p.media_botijoes)}
                />
                <span>
                  <span className="font-medium">{p.nome}</span>
                  {p.povoado && (
                    <span className="block text-xs text-muted-foreground">{p.povoado}</span>
                  )}
                </span>
              </label>
              {sel ? (
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  value={sel.cheios}
                  onChange={(e) => setCheios(p.id, Number(e.target.value))}
                />
              ) : (
                <Badge variant="secondary">méd. {p.media_botijoes}</Badge>
              )}
            </div>
          );
        })}
      </div>
      <FormMessage />
    </FormItem>
  );
}
