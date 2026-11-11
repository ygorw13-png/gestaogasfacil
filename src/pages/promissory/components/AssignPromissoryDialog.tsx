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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cobrador } from "../hooks/useCollectors";

interface AssignPromissoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectors: Cobrador[];
  /** Resolve após a gravação confirmada; rejeita com o motivo. */
  onSubmit: (cobrador: Cobrador) => Promise<void> | void;
}

/** Atribui o cobrador por ID (o nome é só exibição). Fecha só depois de gravar. */
export function AssignPromissoryDialog({
  open,
  onOpenChange,
  collectors,
  onSubmit,
}: AssignPromissoryDialogProps) {
  const [selectedId, setSelectedId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => { if (open) { setSelectedId(""); setErro(null); } }, [open]);

  const handleSubmit = async () => {
    const cobrador = collectors.find((c) => c.id === selectedId);
    if (!cobrador || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await onSubmit(cobrador);
      onOpenChange(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível atribuir.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !enviando && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir cobrador</DialogTitle>
          <DialogDescription>
            Selecione quem vai realizar esta cobrança.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collector">Cobrador</Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={enviando}>
              <SelectTrigger id="collector">
                <SelectValue placeholder={collectors.length ? "Selecione o cobrador" : "Nenhum cobrador ativo cadastrado"} />
              </SelectTrigger>
              <SelectContent>
                {collectors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedId || enviando}>
            {enviando ? "Registrando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
