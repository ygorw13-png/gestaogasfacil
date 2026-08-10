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

type Campos = { cheios: number; vazios: number; emprestados: number };

export function CorrigirEstoqueDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const registrar = useRegistrarMovimentacao();
  const { data: saldo } = useSaldoPortaria();

  const [produto, setProduto] = useState<PortariaProduto>("P13");
  const [valores, setValores] = useState<Campos>({ cheios: 0, vazios: 0, emprestados: 0 });
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!open) return;
    const s = saldo?.[produto];
    setValores({
      cheios: s?.cheios ?? 0,
      vazios: s?.vazios ?? 0,
      emprestados: s?.emprestados ?? 0,
    });
  }, [open, produto, saldo]);

  useEffect(() => {
    if (!open) setMotivo("");
  }, [open]);

  const atual: Campos = {
    cheios: saldo?.[produto]?.cheios ?? 0,
    vazios: saldo?.[produto]?.vazios ?? 0,
    emprestados: saldo?.[produto]?.emprestados ?? 0,
  };

  const deltas = {
    cheios: valores.cheios - atual.cheios,
    vazios: valores.vazios - atual.vazios,
    emprestados: valores.emprestados - atual.emprestados,
  };
  const semMudanca = deltas.cheios === 0 && deltas.vazios === 0 && deltas.emprestados === 0;

  const handleSubmit = async () => {
    if (semMudanca) {
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
    try {
      await registrar.mutateAsync({
        tipo: "ajuste",
        produto,
        delta_cheios: deltas.cheios,
        delta_vazios: deltas.vazios,
        delta_emprestados: deltas.emprestados,
        observacoes: `Correção manual — de ${atual.cheios}/${atual.vazios}/${atual.emprestados} para ${valores.cheios}/${valores.vazios}/${valores.emprestados} (cheios/vazios/emprestados). Motivo: ${motivo.trim()}`,
      });
      toast({
        title: "Estoque corrigido",
        description: `${produtoLabel(produto)} atualizado e registrado no histórico do dia.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Não foi possível corrigir",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const campo = (key: keyof Campos, label: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={0}
        value={valores[key]}
        onChange={(e) =>
          setValores((v) => ({ ...v, [key]: Math.max(0, Number(e.target.value)) }))
        }
      />
      <p className="text-[10px] text-muted-foreground">
        Sistema: {atual[key]}
        {deltas[key] !== 0 && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            {" "}({deltas[key] > 0 ? "+" : ""}
            {deltas[key]})
          </span>
        )}
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corrigir estoque da portaria</DialogTitle>
          <DialogDescription>
            Informe a quantidade correta. A diferença é registrada como ajuste no histórico do dia
            (o histórico de correções zera todo dia).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <Label className="text-xs">Produto</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUTOS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={produto === p ? "default" : "outline"}
                  onClick={() => setProduto(p)}
                >
                  {produtoLabel(p)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {campo("cheios", "Cheios")}
            {campo("vazios", "Vazios")}
            {campo("emprestados", "Emprestados")}
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor="motivo-correcao">
              Motivo da correção <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo-correcao"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: lancei 10 cheios por engano, o correto era 8"
              rows={2}
              aria-invalid={motivo.trim().length < 3}
            />
            {motivo.trim().length < 3 && (
              <p className="text-xs text-red-500 font-medium">
                Informe o motivo para salvar a correção.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={registrar.isPending || semMudanca}>
            Salvar correção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
