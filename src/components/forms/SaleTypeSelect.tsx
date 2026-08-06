import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_VENDA, type TipoVenda } from "@/lib/saleTypes";

interface Props {
  value: TipoVenda;
  onChange: (v: TipoVenda) => void;
  id?: string;
  label?: string;
}

export function SaleTypeSelect({ value, onChange, id = "tipo-venda", label = "Tipo de venda" }: Props) {
  const current = TIPOS_VENDA.find((t) => t.value === value);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as TipoVenda)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIPOS_VENDA.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current && <p className="text-xs text-muted-foreground">{current.description}</p>}
    </div>
  );
}
