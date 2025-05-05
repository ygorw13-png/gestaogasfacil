
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const fixedExpenseSchema = z.object({
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  amount: z.coerce.number().min(0, "Valor não pode ser negativo"),
  dueDay: z.coerce.number().min(1, "Dia inválido").max(31, "Dia inválido"),
  lastPayment: z.date().optional(),
  notes: z.string().optional(),
});

interface NewFixedExpenseFormProps {
  onSuccess: () => void;
}

export default function NewFixedExpenseForm({ onSuccess }: NewFixedExpenseFormProps) {
  const form = useForm<z.infer<typeof fixedExpenseSchema>>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
      dueDay: 1,
      notes: "",
    },
  });

  const onSubmit = (data: z.infer<typeof fixedExpenseSchema>) => {
    // Em um ambiente real, enviaríamos para o backend
    console.log("Despesa fixa cadastrada:", data);
    
    // Mostrar toast de sucesso
    toast({
      title: "Despesa fixa cadastrada",
      description: `${data.description} foi adicionada com sucesso.`,
    });
    
    // Fechar o formulário
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aluguel, Internet, etc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="utilities">Serviços Públicos (Água, Luz, Gás)</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="insurance">Seguros</SelectItem>
                  <SelectItem value="subscription">Assinaturas</SelectItem>
                  <SelectItem value="tax">Impostos</SelectItem>
                  <SelectItem value="salary">Salários</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="lastPayment"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Último Pagamento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                  placeholder="Informações adicionais sobre esta despesa fixa" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
