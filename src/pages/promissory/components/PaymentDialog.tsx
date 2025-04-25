
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const paymentMethods = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência Bancária"
];

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  promissoryId: number | null;
}

export function PaymentDialog({
  isOpen,
  onOpenChange,
  promissoryId,
}: PaymentDialogProps) {
  const [paymentValue, setPaymentValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  
  const handleSubmit = () => {
    if (!paymentValue || !paymentMethod) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    // Aqui você implementaria a lógica para registrar o pagamento
    toast.success("Pagamento registrado com sucesso");
    onOpenChange(false);
    
    // Reset form
    setPaymentValue("");
    setPaymentMethod("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Informe os detalhes do pagamento recebido.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={paymentValue}
              onChange={(e) => setPaymentValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Forma de Pagamento</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
              <SelectTrigger id="method">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
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
          <Button onClick={handleSubmit}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
