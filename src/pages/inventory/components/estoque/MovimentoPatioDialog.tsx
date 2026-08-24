import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRegistrarMovimentacao } from "@/pages/entrance/hooks/usePortariaStock";
import {
  PRODUTOS_ESTOQUE,
  produtoLabelEstoque,
  type EstoqueGeralLinha,
} from "../../hooks/useEstoqueGeral";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** entrada = compra/recebimento da distribuidora | ajuste = correção de contagem */
  modo: "entrada" | "ajuste";
  linhas: EstoqueGeralLinha[];
  onDone: () => void;
}

type Valores = Record<string, { cheios: number; vazios: number }>;

const zerado = (): Valores =>
  Object.fromEntries(PRODUTOS_ESTOQUE.map((p) => [p, { cheios: 0, vazios: 0 }]));

export function MovimentoPatioDialog({ open, onOpenChange, modo, linhas, onDone }: Props) {
  const { toast } = useToast();
  const registrar = useRegistrarMovimentacao();
  const [valores, setValores] = useState<Valores>(zerado);
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const isAjuste = modo === "ajuste";

  useEffect(() => {
    if (!open) return;
    setObs("");
    if (isAjuste) {
      setValores(
        Object.fromEntries(
          linhas.map((l) => [l.produto, { cheios: l.patio_cheios, vazios: l.patio_vazios }])
        )
      );
    } else {
      setValores(zerado());
    }
  }, [open, isAjuste, linhas]);

  const handleSubmit = async () => {
    const lancamentos = PRODUTOS_ESTOQUE.map((p) => {
      const atual = linhas.find((l) => l.produto === p);
      const v = valores[p] || { cheios: 0, vazios: 0 };
      const dc = isAjuste ? v.cheios - (atual?.patio_cheios ?? 0) : v.cheios;
      const dv = isAjuste ? v.vazios - (atual?.patio_vazios ?? 0) : v.vazios;
      return { produto: p, dc, dv };
    }).filter((l) => l.dc !== 0 || l.dv !== 0);

    if (lancamentos.length === 0) {
      toast({
        title: "Nada para lançar",
        description: isAjuste
          ? "Os valores estão iguais ao sistema."
          : "Informe pelo menos uma quantidade.",
      });
      return;
    }
    if (isAjuste && obs.trim().length < 3) {
      toast({
        title: "Informe o motivo",
        description: "Descreva rapidamente o motivo da correção.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      for (const l of lancamentos) {
        await registrar.mutateAsync({
          tipo: isAjuste ? "ajuste_patio" : "entrada_patio",
          produto: l.produto,
          delta_cheios: l.dc,
          delta_vazios: l.dv,
          observacoes: obs.trim() || (isAjuste ? "Correção do pátio" : "Entrada no pátio"),
        });
      }
      toast({
        title: isAjuste ? "Estoque corrigido" : "Entrada registrada",
        description: `${lancamentos.length} produto(s) atualizado(s) no pátio.`,
      });
      onDone();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Não foi possível salvar",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isAjuste ? "Corrigir estoque do pátio" : "Entrada de estoque no pátio"}
          </DialogTitle>
          <DialogDescription>
            {isAjuste
              ? "Informe a quantidade contada. A diferença é registrada nas movimentações."
              : "Registre cheios recebidos da distribuidora e vasilhames que entraram no pátio."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {PRODUTOS_ESTOQUE.map((p) => {
            const atual = linhas.find((l) => l.produto === p);
            const v = valores[p] || { cheios: 0, vazios: 0 };
            return (
              <div key={p} className="grid grid-cols-3 items-end gap-2">
                <div className="text-sm font-medium pb-2">{produtoLabelEstoque(p)}</div>
                <div className="space-y-1">
                  <Label className="text-xs">Cheios</Label>
                  <Input
                    type="number"
                    value={v.cheios}
                    min={isAjuste ? 0 : undefined}
                    onChange={(e) =>
                      setValores((s) => ({
                        ...s,
                        [p]: { ...v, cheios: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                  {isAjuste && (
                    <p className="text-[10px] text-muted-foreground">
                      Sistema: {atual?.patio_cheios ?? 0}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Vasilhames</Label>
                  <Input
                    type="number"
                    value={v.vazios}
                    min={isAjuste ? 0 : undefined}
                    onChange={(e) =>
                      setValores((s) => ({
                        ...s,
                        [p]: { ...v, vazios: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                  {isAjuste && (
                    <p className="text-[10px] text-muted-foreground">
                      Sistema: {atual?.patio_vazios ?? 0}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="space-y-1">
            <Label className="text-xs">
              {isAjuste ? "Motivo da correção *" : "Observações"}
            </Label>
            <Textarea
              rows={2}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder={isAjuste ? "Ex.: recontagem do pátio" : "Ex.: nota 1234 da distribuidora"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isAjuste ? "Salvar correção" : "Registrar entrada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
