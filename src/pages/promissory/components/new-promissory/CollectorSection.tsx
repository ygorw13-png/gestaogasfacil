
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CollectorSectionProps {
  collectors: string[];
  collector: string | null;
  setCollector: (value: string) => void;
}

export function CollectorSection({ collectors, collector, setCollector }: CollectorSectionProps) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="collector" className="text-right">
        Cobrador (opcional)
      </Label>
      <Select
        value={collector || ""}
        onValueChange={setCollector}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Não atribuir agora" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Não atribuir agora</SelectItem>
          {collectors.map(collector => (
            <SelectItem key={collector} value={collector}>
              {collector}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
