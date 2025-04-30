
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Control, useFormState } from "react-hook-form";
import { FormValues } from "../types/formTypes";

interface PaymentFormSectionProps {
  control: Control<FormValues>;
}

export function PaymentFormSection({ control }: PaymentFormSectionProps) {
  const { errors } = useFormState({ control });
  
  const hasErrors = !!errors.paymentMethod || !!errors.observations;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Pagamento e Observações</h3>
      
      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Por favor, corrija os erros abaixo antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      <FormField
        control={control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forma de Pagamento *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="money">Dinheiro</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                <SelectItem value="debit">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="promissory">Promissória</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="observations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Observações adicionais sobre o pedido"
                className="resize-none"
                maxLength={500}
                {...field}
                onChange={(e) => {
                  // Sanitiza a entrada limitando a 500 caracteres
                  const sanitized = e.target.value.substring(0, 500);
                  field.onChange(sanitized);
                }}
              />
            </FormControl>
            <p className="text-xs text-gray-500 mt-1">
              {field.value?.length || 0}/500 caracteres
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
