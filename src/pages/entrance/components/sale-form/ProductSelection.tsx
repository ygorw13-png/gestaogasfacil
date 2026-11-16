
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { infoForma, lerValor } from "@/lib/formasPagamento";
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
  hidePrice?: boolean;
  paymentMethod?: string;
}

const ELECTRONIC_PAYMENTS = ["cash", "money", "credit", "debit", "pix"];
const GAS_PRODUCTS = ["p13", "p20", "p45"];

export function ProductSelection({
  product,
  quantity,
  unitPrice,
  onProductChange,
  onQuantityChange,
  onUnitPriceChange,
  readOnlyPrice = false,
  hidePrice = false,
  paymentMethod = "",
}: ProductSelectionProps) {
  // Texto digitado (aceita vírgula). Vazio = valor não informado (0 no formulário).
  const ler = (t: string) => {
    const n = lerValor(t.replace(/[.,]$/, ""));
    return n !== null && !Number.isNaN(n) ? n : 0;
  };
  const fmt = (n: number) => (n > 0 ? String(n).replace(".", ",") : "");
  const [texto, setTexto] = useState(() => fmt(unitPrice));
  useEffect(() => {
    // Preço trocado por fora (agregado, limpeza do formulário): mostra o novo valor.
    if (ler(texto) !== unitPrice) setTexto(fmt(unitPrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitPrice]);
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value.replace(/[^0-9.,]/g, "");
    setTexto(t);
    onUnitPriceChange(ler(t));
  };
  const forma = infoForma(paymentMethod);
  const valorOpcional = !!forma && !forma.valorObrigatorio;

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
              <SelectItem value="vasilhame_p13">Vasilhame P13 (vazio)</SelectItem>

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

      {!hidePrice && (
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
            value={texto}
            placeholder={valorOpcional ? "Opcional" : "0,00"}
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
          {forma?.valorObrigatorio && !readOnlyPrice && !highlightPrice && (
            <p className="text-xs text-muted-foreground">Obrigatório para {forma.rotulo}</p>
          )}
          {valorOpcional && !readOnlyPrice && (
            <p className="text-xs text-muted-foreground">
              Opcional para {forma!.rotulo}. Em branco, a venda fica com valor não informado.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalPrice">Valor Total (R$)</Label>
          <Input
            type="text"
            id="totalPrice"
            value={valorOpcional && !(unitPrice > 0) ? "Não informado" : (quantity * unitPrice).toFixed(2)}
            readOnly
            className={highlightPrice ? "bg-primary/5 font-semibold text-base" : "bg-muted"}
          />
        </div>
      </div>
      )}
    </div>
  );
}
