
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Nota: Em um cenário real, esta lista viria de uma API
const DRIVERS = [
  { id: "", name: "Todos os Motoristas" },
  { id: "1", name: "João Silva" },
  { id: "2", name: "Pedro Santos" },
  { id: "3", name: "Maria Oliveira" },
  { id: "4", name: "Ana Costa" }
];

interface DriverFilterProps {
  driverId: string;
  onDriverIdChange: (id: string) => void;
}

export function DriverFilter({ driverId, onDriverIdChange }: DriverFilterProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Motorista</label>
      <Select value={driverId} onValueChange={onDriverIdChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um motorista" />
        </SelectTrigger>
        <SelectContent>
          {DRIVERS.map((driver) => (
            <SelectItem key={driver.id} value={driver.id}>
              {driver.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
