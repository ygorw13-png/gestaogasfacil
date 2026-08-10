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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { syncStockWithDashboard } from "@/pages/dashboard/data";
import { addDailyAdjustment } from "@/lib/dailyAdjustLog";
import type { StockData } from "./stock/StockData";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentStock: StockData;
  onCorrected: () => void;
}

const CAMPOS: { key: keyof StockData; label: string }[] = [
  { key: "p13", label: "GLP P13" },
  { key: "p20", label: "GLP P20" },
  { key: "p45", label: "GLP P45" },
  { key: "water", label: "Água 20L" },
];

export function CorrigirEstoqueGeralDialog({
  open,
  onOpenChange,
  currentStock,
  onCorrected,
}: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [values, setValues] = useState<StockData>(currentStock);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(currentStock);
      setMotivo("");
    }
  }, [open, currentStock]);

  const alterados = CAMPOS.filter((c) => values[c.key] !== currentStock[c.key]);

  const handleSubmit = async () => {
    if (alterados.length === 0) {
      toast({ title: "Nada para corrigir", description: "Os valores estão iguais ao sistema." });
      return;
    }
    if (motivo.trim().length < 3) {
      toast({
        title: "Informe o motivo",
        description: "Descreva rapidamente o motivo da correção.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await syncStockWithDashboard(values);
      alterados.forEach((c) =>
        addDailyAdjustment("estoque_geral", {
          who: (user as any)?.name || (user as any)?.email || "",
          produto: c.label,
          de: currentStock[c.key],
          para: values[c.key],
          motivo: motivo.trim(),
        })
      );
      toast({
        title: "Estoque corrigido",
        description: `${alterados.length} item(ns) atualizado(s).`,
      });
      onCorrected();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Não foi possível corrigir",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corrigir estoque geral</DialogTitle>
          <DialogDescription>
            Informe a quantidade correta de cada produto. As correções ficam registradas em um
            pequeno histórico do dia (zera todo dia).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-1">
          {CAMPOS.map((c) => {
            const dif = values[c.key] - currentStock[c.key];
            return (
              <div key={c.key} className="space-y-1">
                <Label className="text-xs">{c.label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={values[c.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [c.key]: Math.max(0, Number(e.target.value)) }))
                  }
                />
                <p className="text-[10px] text-muted-foreground">
                  Sistema: {currentStock[c.key]}
                  {dif !== 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {" "}({dif > 0 ? "+" : ""}
                      {dif})
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Motivo da correção</Label>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: digitei 100 no lugar de 10"
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || alterados.length === 0}>
            Salvar correção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
