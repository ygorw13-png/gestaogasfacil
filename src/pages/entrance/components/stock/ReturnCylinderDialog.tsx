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
}

export function ReturnCylinderDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const registrar = useRegistrarMovimentacao();

  const [produto, setProduto] = useState<PortariaProduto>("P13");
  const [quantidade, setQuantidade] = useState(1);
  const [clienteNome, setClienteNome] = useState("");
  const [abateComodato, setAbateComodato] = useState(true);
  const [obs, setObs] = useState("");

  const reset = () => {
    setProduto("P13");
    setQuantidade(1);
    setClienteNome("");
    setAbateComodato(true);
    setObs("");
  };

  const handleSubmit = async () => {
    if (quantidade < 1) return;

    await registrar.mutateAsync({
      tipo: "devolucao_vasilhame",
      produto,
      delta_vazios: quantidade,
      delta_emprestados: abateComodato ? -quantidade : 0,
      cliente_nome: clienteNome || null,
      observacoes: obs || null,
    });

    toast({
      title: "Devolução registrada",
      description: `${quantidade}× ${produtoLabel(produto)}${
        clienteNome ? ` de ${clienteNome}` : ""
      }`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolução de vasilhame</DialogTitle>
          <DialogDescription>
            Cliente devolveu vasilhame vazio (com ou sem comodato anterior).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cliente (opcional)</Label>
            <Input
              placeholder="Nome do cliente"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={abateComodato}
              onChange={(e) => setAbateComodato(e.target.checked)}
              className="rounded"
            />
            Abater do saldo de comodato (se houver empréstimo prévio)
          </label>

          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
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
            {registrar.isPending ? "Registrando..." : "Confirmar devolução"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
