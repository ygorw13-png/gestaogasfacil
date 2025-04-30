
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { RouteFormSchema } from "../schemas/routeFormSchema";

interface InventorySectionProps {
  control: Control<RouteFormSchema>;
}

export function InventorySection({ control }: InventorySectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField
        control={control}
        name="inventory.gasP13"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Botijões P13 (Cheios)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="inventory.gasP20"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Botijões P20 (Cheios)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="inventory.gasP45"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Botijões P45 (Cheios)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="inventory.water"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Água (Galões)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
