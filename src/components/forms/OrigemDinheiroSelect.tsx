import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ORIGEM_DINHEIRO_LABELS } from "@/hooks/useDespesas";

interface Props {
  form: UseFormReturn<any>;
  name?: string;
}

export function OrigemDinheiroSelect({ form, name = "origem_dinheiro" }: Props) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-primary font-semibold">
            <Wallet className="h-4 w-4" />
            De onde saiu o dinheiro?
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="border-primary/50 focus:border-primary">
                <SelectValue placeholder="Selecione a origem do pagamento" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(ORIGEM_DINHEIRO_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Se sair do caixa da portaria, uma sangria automática será lançada para o fechamento bater.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
