
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

export function ProductSelection({
  product,
  quantity,
  unitPrice,
  onProductChange,
  onQuantityChange,
  onUnitPriceChange,
  readOnlyPrice = false,
}: ProductSelectionProps) {
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
          <Label htmlFor="unitPrice">Valor Unitário (R$)</Label>
          <Input
            type="number"
            id="unitPrice"
            step="0.01"
            value={unitPrice}
            onChange={(e) => onUnitPriceChange(Number(e.target.value))}
            readOnly={readOnlyPrice}
            className={readOnlyPrice ? "bg-muted" : ""}
          />
          {readOnlyPrice && (
            <p className="text-xs text-muted-foreground">Valor fixado no cadastro do agregado</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalPrice">Valor Total (R$)</Label>
          <Input
            type="number"
            id="totalPrice"
            step="0.01"
            value={(quantity * unitPrice).toFixed(2)}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>
    </div>
  );
}
