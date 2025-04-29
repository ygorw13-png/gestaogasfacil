
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
import { ColaboradorSelect } from "@/components/inputs/ColaboradorSelect";

interface AssignOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDeliveryPerson: string;
  onDeliveryPersonChange: (value: string) => void;
  onSubmit: () => void;
}

export function AssignOrderDialog({
  isOpen,
  onOpenChange,
  selectedDeliveryPerson,
  onDeliveryPersonChange,
  onSubmit,
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
            <ColaboradorSelect 
              value={selectedDeliveryPerson} 
              onValueChange={onDeliveryPersonChange}
              cargo="Entregador"
              placeholder="Selecione o entregador"
            />
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
