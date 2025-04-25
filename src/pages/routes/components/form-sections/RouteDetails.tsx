
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";

interface RouteDetailsProps {
  control: Control<RouteFormSchema>;
}

export function RouteDetails({ control }: RouteDetailsProps) {
  return (
    <>
      <FormField
        control={control}
        name="destination"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Destino *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Povoado Santa Maria" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="departureTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horário de Saída *</FormLabel>
            <FormControl>
              <Input type="time" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
