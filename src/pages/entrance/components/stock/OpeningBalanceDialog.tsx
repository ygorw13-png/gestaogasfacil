import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useRegistrarMovimentacao,
  useSaldoPortaria,
  produtoLabel,
  type PortariaProduto,
} from "../../hooks/usePortariaStock";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const PRODUTOS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

interface Suggestion {
  cheios: number;
  vazios: number;
}

export function OpeningBalanceDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const registrar = useRegistrarMovimentacao();
  const { data: saldoAtual } = useSaldoPortaria();

  const [values, setValues] = useState<Record<PortariaProduto, Suggestion>>({
    P13: { cheios: 0, vazios: 0 },
    P20: { cheios: 0, vazios: 0 },
    P45: { cheios: 0, vazios: 0 },
    agua: { cheios: 0, vazios: 0 },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Buscar último fechamento de cada produto
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await (supabase as any)
          .from("movimentacoes_portaria")
          .select("produto, delta_cheios, delta_vazios")
          .eq("tipo", "fechamento")
          .order("criado_em", { ascending: false })
          .limit(20);

        const sugs: Record<PortariaProduto, Suggestion> = {
          P13: { cheios: 0, vazios: 0 },
          P20: { cheios: 0, vazios: 0 },
          P45: { cheios: 0, vazios: 0 },
          agua: { cheios: 0, vazios: 0 },
        };
        const seen = new Set<string>();
        (data || []).forEach((row: any) => {
          if (!seen.has(row.produto) && PRODUTOS.includes(row.produto)) {
            sugs[row.produto as PortariaProduto] = {
              cheios: Math.abs(row.delta_cheios) || 0,
              vazios: Math.abs(row.delta_vazios) || 0,
            };
            seen.add(row.produto);
          }
        });
        setValues(sugs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open]);

  const handleSubmit = async () => {
    let divergencias = 0;
    for (const p of PRODUTOS) {
      const cur = saldoAtual?.[p];
      const sistemaCheios = cur?.cheios ?? 0;
      const sistemaVazios = cur?.vazios ?? 0;
      const target = values[p];
      const deltaCheios = target.cheios - sistemaCheios;
      const deltaVazios = target.vazios - sistemaVazios;
      if (deltaCheios === 0 && deltaVazios === 0) continue;

      const temSaldoSistema = sistemaCheios !== 0 || sistemaVazios !== 0;
      if (temSaldoSistema) divergencias++;

      await registrar.mutateAsync({
        tipo: temSaldoSistema ? "ajuste" : "abertura",
        produto: p,
        delta_cheios: deltaCheios,
        delta_vazios: deltaVazios,
        observacoes: temSaldoSistema
          ? `Divergência na abertura — sistema: ${sistemaCheios} cheios / ${sistemaVazios} vazios; contado: ${target.cheios} cheios / ${target.vazios} vazios`
          : "Saldo de abertura do dia",
      });
    }

    // Garante que o dia fique marcado como aberto mesmo sem alterações
    const jaTemMovimento = PRODUTOS.some((p) => {
      const cur = saldoAtual?.[p];
      return (cur?.cheios ?? 0) !== 0 || (cur?.vazios ?? 0) !== 0;
    });
    if (!jaTemMovimento) {
      await registrar.mutateAsync({
        tipo: "abertura",
        produto: "P13",
        delta_cheios: 0,
        delta_vazios: 0,
        observacoes: "Abertura confirmada sem saldo remanescente",
      });
    }

    toast({
      title: "Saldo de abertura registrado",
      description:
        divergencias > 0
          ? `${divergencias} divergência(s) registrada(s) como ajuste para auditoria.`
          : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abertura do dia</DialogTitle>
          <DialogDescription>
            Confirme o saldo de cheios e vazios em estoque. Os valores foram sugeridos com base no
            último fechamento. Diferenças em relação ao sistema são registradas como ajuste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {loading && <p className="text-sm text-muted-foreground">Carregando sugestão...</p>}
          {PRODUTOS.map((p) => {
            const sistemaCheios = saldoAtual?.[p]?.cheios ?? 0;
            const sistemaVazios = saldoAtual?.[p]?.vazios ?? 0;
            const difCheios = values[p].cheios - sistemaCheios;
            const difVazios = values[p].vazios - sistemaVazios;
            const temDif = (sistemaCheios !== 0 || sistemaVazios !== 0) && (difCheios !== 0 || difVazios !== 0);
            return (
              <div key={p} className="space-y-1">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                  <Label className="font-medium">{produtoLabel(p)}</Label>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block">Cheios</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={values[p].cheios}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [p]: { ...v[p], cheios: Math.max(0, Number(e.target.value)) } }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block">Vazios</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={values[p].vazios}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [p]: { ...v[p], vazios: Math.max(0, Number(e.target.value)) } }))
                      }
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Sistema: {sistemaCheios} cheios / {sistemaVazios} vazios
                  {temDif && (
                    <span className="text-destructive font-medium">
                      {" "}• Divergência: {difCheios > 0 ? "+" : ""}
                      {difCheios} cheios, {difVazios > 0 ? "+" : ""}
                      {difVazios} vazios
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={registrar.isPending}>
            Confirmar abertura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
