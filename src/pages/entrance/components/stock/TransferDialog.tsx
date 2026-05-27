import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useRegistrarMovimentacao,
  produtoLabel,
  type PortariaProduto,
} from "../../hooks/usePortariaStock";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  direction: "in" | "out"; // in = pátio → portaria, out = portaria → pátio
}

export function TransferDialog({ open, onOpenChange, direction }: Props) {
  const { toast } = useToast();
  const registrar = useRegistrarMovimentacao();

  const [produto, setProduto] = useState<PortariaProduto>("P13");
  const [cheios, setCheios] = useState(0);
  const [vazios, setVazios] = useState(0);
  const [obs, setObs] = useState("");

  const reset = () => {
    setProduto("P13");
    setCheios(0);
    setVazios(0);
    setObs("");
  };

  const handleSubmit = async () => {
    if (cheios === 0 && vazios === 0) {
      toast({
        title: "Informe quantidades",
        description: "Adicione pelo menos cheios ou vazios",
        variant: "destructive",
      });
      return;
    }

    const sign = direction === "in" ? 1 : -1;
    await registrar.mutateAsync({
      tipo:
        direction === "in"
          ? "transferencia_patio_para_portaria"
          : "transferencia_portaria_para_patio",
      produto,
      delta_cheios: sign * cheios,
      delta_vazios: sign * vazios,
      observacoes: obs || null,
    });

    toast({
      title: direction === "in" ? "Recebido do pátio" : "Enviado ao pátio",
      description: `${produtoLabel(produto)}: ${cheios} cheios, ${vazios} vazios`,
    });
    reset();
    onOpenChange(false);
  };

  const title = direction === "in" ? "Receber do pátio" : "Enviar ao pátio";
  const desc =
    direction === "in"
      ? "Entrada de produtos vindos do pátio para a portaria."
      : "Saída de produtos da portaria para o pátio.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={produto} onValueChange={(v) => setProduto(v as PortariaProduto)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P13">GLP P13</SelectItem>
                <SelectItem value="P20">GLP P20</SelectItem>
                <SelectItem value="P45">GLP P45</SelectItem>
                <SelectItem value="agua">Água 20L</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cheios</Label>
              <Input
                type="number"
                min={0}
                value={cheios}
                onChange={(e) => setCheios(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="space-y-2">
              <Label>Vazios</Label>
              <Input
                type="number"
                min={0}
                value={vazios}
                onChange={(e) => setVazios(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
              placeholder="Ex.: troca de turno, devolução de rota..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={registrar.isPending}>
            {registrar.isPending ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
