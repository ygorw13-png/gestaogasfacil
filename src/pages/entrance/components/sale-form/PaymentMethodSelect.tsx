
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PaymentMethodSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function PaymentMethodSelect({ value, onChange }: PaymentMethodSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="paymentMethod">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cash">Dinheiro</SelectItem>
          <SelectItem value="credit">Cartão de Crédito</SelectItem>
          <SelectItem value="debit">Cartão de Débito</SelectItem>
          <SelectItem value="pix">PIX</SelectItem>
          <SelectItem value="promissory">Promissória</SelectItem>
          <SelectItem value="gasPovo">Gás-Povo</SelectItem>
          <SelectItem value="gasVoucher">Vale-Gás</SelectItem>
          <SelectItem value="partner">Convênio</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
