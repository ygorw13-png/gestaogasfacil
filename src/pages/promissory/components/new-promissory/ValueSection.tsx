
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ValueSectionProps {
  value: string;
  setValue: (value: string) => void;
}

export function ValueSection({ value, setValue }: ValueSectionProps) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="value" className="text-right">
        Valor (R$)
      </Label>
      <Input
        id="value"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
        placeholder="Ex: 150.00"
        type="text"
        inputMode="decimal"
        className="col-span-3"
      />
    </div>
  );
}
