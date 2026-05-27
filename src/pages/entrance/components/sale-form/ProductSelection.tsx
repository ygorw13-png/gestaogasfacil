
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductSelectionProps {
  product: string;
  quantity: number;
  unitPrice: number;
  onProductChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onUnitPriceChange: (value: number) => void;
  readOnlyPrice?: boolean;
  paymentMethod?: string;
}

const ELECTRONIC_PAYMENTS = ["cash", "credit", "debit", "pix"];
const GAS_PRODUCTS = ["p13", "p20", "p45"];

export function ProductSelection({
  product,
  quantity,
  unitPrice,
  onProductChange,
  onQuantityChange,
  onUnitPriceChange,
  readOnlyPrice = false,
  paymentMethod = "",
}: ProductSelectionProps) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    onUnitPriceChange(Number(value));
  };

  const highlightPrice =
    GAS_PRODUCTS.includes(product) &&
    ELECTRONIC_PAYMENTS.includes(paymentMethod) &&
    !readOnlyPrice;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product">Produto</Label>
          <Select value={product} onValueChange={onProductChange}>
            <SelectTrigger id="product">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p13">GLP P13</SelectItem>
              <SelectItem value="p20">GLP P20</SelectItem>
              <SelectItem value="p45">GLP P45</SelectItem>
              <SelectItem value="water">Água 20L</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="unitPrice"
            className={highlightPrice ? "text-primary font-semibold flex items-center gap-1" : ""}
          >
            {highlightPrice && <DollarSign className="h-4 w-4" />}
            Valor Unitário (R$)
          </Label>
          <Input
            type="text"
            inputMode="decimal"
            id="unitPrice"
            value={unitPrice}
            onChange={handlePriceChange}
            readOnly={readOnlyPrice}
            className={
              readOnlyPrice
                ? "bg-muted"
                : highlightPrice
                ? "border-primary border-2 ring-2 ring-primary/20 font-semibold text-base"
                : ""
            }
            autoFocus={highlightPrice}
          />
          {readOnlyPrice && (
            <p className="text-xs text-muted-foreground">Valor fixado no cadastro do agregado</p>
          )}
          {highlightPrice && (
            <p className="text-xs text-primary">Informe o valor cobrado nesta venda</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalPrice">Valor Total (R$)</Label>
          <Input
            type="text"
            id="totalPrice"
            value={(quantity * unitPrice).toFixed(2)}
            readOnly
            className={highlightPrice ? "bg-primary/5 font-semibold text-base" : "bg-muted"}
          />
        </div>
      </div>
    </div>
  );
}
