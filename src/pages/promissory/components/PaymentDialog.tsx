
import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { PromissoryNote } from "../types";

const paymentMethods = [
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência Bancária"
];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, method: string) => void;
  noteId: string | null;
  notes: PromissoryNote[];
}

export function PaymentDialog({
  open,
  onOpenChange,
  onSubmit,
  noteId,
  notes,
}: PaymentDialogProps) {
  const [paymentValue, setPaymentValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  
  useEffect(() => {
    if (open && noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setPaymentValue(note.value.toString());
      }
    }
  }, [open, noteId, notes]);
  
  const handleSubmit = () => {
    if (!paymentValue || !paymentMethod) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(paymentValue);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do pagamento deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(amount, paymentMethod);
    
    // Reset form
    setPaymentValue("");
    setPaymentMethod("");
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={paymentValue}
              onChange={(e) => setPaymentValue(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
              className="col-span-3"
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
