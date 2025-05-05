
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { MaintenanceExpenseFormData } from "../schemas/maintenanceExpenseSchema";

interface AdditionalInfoProps {
  form: UseFormReturn<MaintenanceExpenseFormData>;
}

export function AdditionalInfo({ form }: AdditionalInfoProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="receiptNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número do Comprovante/Nota</FormLabel>
            <FormControl>
              <Input placeholder="Número de identificação do documento" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Detalhes sobre o serviço realizado" 
                className="resize-none" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
