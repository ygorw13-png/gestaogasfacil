
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
import { PaymentSummary } from "./components/PaymentSummary";
import { InventoryTable } from "./components/InventoryTable";
import { ObservationsSection } from "./components/ObservationsSection";
import { CashierData } from "./types/cashierTypes";
import { formatCurrency, formatQuantities } from "@/lib/formatUtils";

interface CashierClosingProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  cashierData: CashierData;
}

export default function CashierClosing({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  cashierData 
}: CashierClosingProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Mock inventory data
  const inventoryClosing = [
    { product: 'GLP P13', initial: 15, additions: 5, sales: 8, final: 12 },
    { product: 'GLP P20', initial: 3, additions: 1, sales: 2, final: 2 },
    { product: 'GLP P45', initial: 1, additions: 1, sales: 0, final: 2 },
    { product: 'Água 20L', initial: 20, additions: 10, sales: 15, final: 15 },
  ];

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
          <PaymentSummary 
            data={cashierData}
            formatCurrency={formatCurrency}
            formatQuantities={formatQuantities}
          />
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
