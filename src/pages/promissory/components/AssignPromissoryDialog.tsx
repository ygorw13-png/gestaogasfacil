
import { useState } from "react";
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

interface AssignPromissoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectors: string[];
  onSubmit: (collector: string) => void;
}

export function AssignPromissoryDialog({
  open,
  onOpenChange,
  collectors,
  onSubmit,
}: AssignPromissoryDialogProps) {
  const [selectedCollector, setSelectedCollector] = useState("");

  const handleSubmit = () => {
    if (selectedCollector) {
      onSubmit(selectedCollector);
      setSelectedCollector("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Promissória</DialogTitle>
          <DialogDescription>
            Selecione o entregador para realizar esta cobrança.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collector">Entregador</Label>
            <Select 
              value={selectedCollector} 
              onValueChange={setSelectedCollector}
            >
              <SelectTrigger id="collector">
                <SelectValue placeholder="Selecione o entregador" />
              </SelectTrigger>
              <SelectContent>
                {collectors.map((collector) => (
                  <SelectItem key={collector} value={collector}>
                    {collector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedCollector}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
