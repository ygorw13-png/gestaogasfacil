import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { PaymentSummary } from "../PaymentSummary";
import { InventoryTable } from "../InventoryTable";
import { ObservationsSection } from "../ObservationsSection";
import { CashierData } from "../../types/cashierTypes";
import { inventoryClosing } from "../../data/mockData";

interface CashierClosingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  cashierData: CashierData;
}

export function CashierClosingDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  cashierData 
}: CashierClosingDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Fechar Caixa</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento de Caixa da Portaria</DialogTitle>
          <DialogDescription>
            Confira os valores recebidos e o estoque final antes de fechar o caixa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentSummary data={cashierData} />
          <InventoryTable data={inventoryClosing} />
          <ObservationsSection />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar Fechamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
