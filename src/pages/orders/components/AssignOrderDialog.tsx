
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

interface AssignOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDeliveryPerson: string;
  onDeliveryPersonChange: (value: string) => void;
  onSubmit: () => void;
  deliveryStaff: Array<{ id: string; name: string; }>;
}

export function AssignOrderDialog({
  isOpen,
  onOpenChange,
  selectedDeliveryPerson,
  onDeliveryPersonChange,
  onSubmit,
  deliveryStaff,
}: AssignOrderDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Pedido</DialogTitle>
          <DialogDescription>
            Selecione o entregador para realizar esta entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryPerson">Entregador</Label>
            <Select 
              value={selectedDeliveryPerson} 
              onValueChange={onDeliveryPersonChange}
            >
              <SelectTrigger id="deliveryPerson">
                <SelectValue placeholder="Selecione o entregador" />
              </SelectTrigger>
              <SelectContent>
                {deliveryStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.name}>
                    {staff.name}
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
            onClick={onSubmit}
            disabled={!selectedDeliveryPerson}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
