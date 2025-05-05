
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FuelExpenseFormData } from "../schemas/fuelExpenseSchema";

interface VehicleSelectionProps {
  form: UseFormReturn<FuelExpenseFormData>;
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
                <SelectValue placeholder="Selecione um veículo" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {/* TODO: Adicionar lista de veículos */}
              <SelectItem value="1">Veículo 1</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
