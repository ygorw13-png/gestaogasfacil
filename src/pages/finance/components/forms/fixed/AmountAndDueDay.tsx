
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FixedExpenseFormData } from "../schemas/fixedExpenseSchema";

interface AmountAndDueDayProps {
  form: UseFormReturn<FixedExpenseFormData>;
}

export function AmountAndDueDay({ form }: AmountAndDueDayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor (R$)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="dueDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dia de Vencimento</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="1" 
                max="31" 
                placeholder="Ex: 5, 10, 15"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
