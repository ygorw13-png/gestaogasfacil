import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";

// Mock data - keep it here for now since it's specific to this component
const mockDrivers = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Pedro Santos" },
  { id: "3", name: "Carlos Ferreira" },
  { id: "4", name: "André Oliveira" },
];

interface DriverSelectionProps {
  control: Control<RouteFormSchema>;
}

export function DriverSelection({ control }: DriverSelectionProps) {
  return (
    <FormField
      control={control}
      name="driverId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Motorista *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motorista" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {mockDrivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
