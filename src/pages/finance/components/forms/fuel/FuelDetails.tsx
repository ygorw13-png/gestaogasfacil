
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FuelExpenseFormData } from "../schemas/fuelExpenseSchema";

interface FuelDetailsProps {
  form: UseFormReturn<FuelExpenseFormData>;
}

export function FuelDetails({ form }: FuelDetailsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="liters"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Litros</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field} 
                onChange={e => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="pricePerLiter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor por Litro</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                {...field} 
                onChange={e => field.onChange(parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
