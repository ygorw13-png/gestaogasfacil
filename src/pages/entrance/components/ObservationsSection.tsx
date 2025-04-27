
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ObservationsSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function ObservationsSection({ value, onChange }: ObservationsSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="observations" className="text-base font-medium">
        Observações
      </Label>
      <Textarea
        id="observations"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Adicione observações relevantes sobre este fechamento..."
        className="min-h-[100px] resize-none"
      />
    </div>
  );
}
