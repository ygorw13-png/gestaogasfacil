
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tags } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Reseller } from "../../../resellers/types";

interface ResellerSelectionProps {
  selectedReseller: Reseller | null;
  onSelectReseller: (reseller: Reseller) => void;
  resellers: Reseller[];
}

export function ResellerSelection({ selectedReseller, onSelectReseller, resellers }: ResellerSelectionProps) {
  const handleSelectReseller = (resellerId: string) => {
    const reseller = resellers.find((item) => item.id === resellerId);
    if (reseller) onSelectReseller(reseller);
  };

  return (
    <div className="space-y-2">
      <Label>Agregado</Label>
      <div className="flex gap-2">
        <Select value={selectedReseller?.id ?? ""} onValueChange={handleSelectReseller}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar agregado" />
          </SelectTrigger>
          <SelectContent>
            {resellers.map((reseller) => (
              <SelectItem key={reseller.id} value={reseller.id}>
                {reseller.name}
                {reseller.phone ? ` — ${reseller.phone}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" aria-label="Agregados">
          <Tags className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
