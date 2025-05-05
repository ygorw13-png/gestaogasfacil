
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FixedExpenseFormData } from "../schemas/fixedExpenseSchema";

interface NotesFieldProps {
  form: UseFormReturn<FixedExpenseFormData>;
}

export function NotesField({ form }: NotesFieldProps) {
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Informações adicionais sobre esta despesa fixa" 
              className="resize-none" 
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
