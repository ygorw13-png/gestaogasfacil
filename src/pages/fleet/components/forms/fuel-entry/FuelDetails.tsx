
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FuelFormData } from "../schemas/fuelEntrySchema";

interface FuelDetailsProps {
  form: UseFormReturn<FuelFormData>;
  onValuesChange: (liters: number, pricePerLiter: number) => void;
}

export function FuelDetails({ form, onValuesChange }: FuelDetailsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="fuelType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Combustível</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="ethanol">Etanol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="diesel-s10">Diesel S10</SelectItem>
                <SelectItem value="gasoline-aditivated">Gasolina Aditivada</SelectItem>
                <SelectItem value="ethanol-aditivated">Etanol Aditivado</SelectItem>
                <SelectItem value="gnv">GNV</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="liters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Litros</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    onValuesChange(
                      Number(e.target.value),
                      Number(form.getValues("pricePerLiter"))
                    );
                  }}
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
              <FormLabel>Preço por Litro (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onValuesChange(
                      Number(form.getValues("liters")),
                      Number(e.target.value)
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
