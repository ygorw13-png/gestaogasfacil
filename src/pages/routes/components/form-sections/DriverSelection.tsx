
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";
import { ColaboradorSelect } from "@/components/inputs/ColaboradorSelect";

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
          <FormControl>
            <ColaboradorSelect
              value={field.value}
              onValueChange={field.onChange}
              cargo="Motorista"
              placeholder="Selecione um motorista"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
