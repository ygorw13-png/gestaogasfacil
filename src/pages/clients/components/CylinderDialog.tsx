
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "../hooks/useClients";

interface CylinderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSubmit: () => void;
  cylinders: {type: string, quantity: number}[];
  onChangeCylinders: (cylinders: {type: string, quantity: number}[]) => void;
}

export function CylinderDialog({ 
  open, 
  onOpenChange, 
  client, 
  onSubmit,
  cylinders,
  onChangeCylinders
}: CylinderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Vasilhames</DialogTitle>
          <DialogDescription>
            {client && `Registrar comodato para ${client.name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {cylinders.map((cylinder, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Vasilhame</Label>
                <Select 
                  defaultValue={cylinder.type}
                  onValueChange={(value) => {
                    const updated = [...cylinders];
                    updated[index].type = value;
                    onChangeCylinders(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P13">GLP P13</SelectItem>
                    <SelectItem value="P20">GLP P20</SelectItem>
                    <SelectItem value="P45">GLP P45</SelectItem>
                    <SelectItem value="Água 20L">Água 20L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input 
                  type="number" 
                  min={1} 
                  defaultValue={cylinder.quantity} 
                  onChange={(e) => {
                    const updated = [...cylinders];
                    updated[index].quantity = parseInt(e.target.value);
                    onChangeCylinders(updated);
                  }}
                />
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            type="button" 
            className="w-full" 
            onClick={() => onChangeCylinders([...cylinders, {type: "P13", quantity: 1}])}
          >
            + Adicionar Outro Tipo
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
