
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockVehicles } from "../../../../fleet/data";
import { UseFormReturn } from "react-hook-form";
import { MaintenanceExpenseFormData } from "../schemas/maintenanceExpenseSchema";

interface VehicleSelectionProps {
  form: UseFormReturn<MaintenanceExpenseFormData>;
}

export function VehicleSelection({ form }: VehicleSelectionProps) {
  return (
    <FormField
      control={form.control}
      name="vehicleId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Veículo</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {mockVehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.model}
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
