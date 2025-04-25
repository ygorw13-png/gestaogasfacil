
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { FormValues } from "../types/formTypes";

interface PaymentFormSectionProps {
  control: Control<FormValues>;
}

export function PaymentFormSection({ control }: PaymentFormSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Pagamento e Observações</h3>
      <FormField
        control={control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forma de Pagamento</FormLabel>
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
