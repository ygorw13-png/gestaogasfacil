import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OrigemDinheiroSelect } from "@/components/forms/OrigemDinheiroSelect";
import { useRegistrarDespesa, type OrigemDinheiro } from "@/hooks/useDespesas";
import { expenseCategories } from "./schemas/miscExpenseSchema";

const schema = z.object({
  description: z.string().min(3, "Mínimo 3 caracteres"),
  category: z.string().min(1, "Categoria obrigatória"),
  amount: z.coerce.number().positive("Valor inválido"),
  data: z.string().min(1),
  origem_dinheiro: z.enum(["caixa_portaria", "cofre", "banco", "pessoal", "promissoria_estabelecimento"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { onSuccess: () => void }

export default function NewMiscExpenseForm({ onSuccess }: Props) {
  const registrar = useRegistrarDespesa();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
      data: new Date().toISOString().slice(0, 10),
      origem_dinheiro: "caixa_portaria" as OrigemDinheiro,
      notes: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    await registrar.mutateAsync({
      tipo: "diversa",
      descricao: values.description,
      valor: values.amount,
      data: values.data,
      origem_dinheiro: values.origem_dinheiro,
      categoria: values.category,
      observacoes: values.notes || null,
    });
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
              <FormControl><Input placeholder="Ex: Material de limpeza" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {expenseCategories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-semibold">Valor (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" className="border-primary/50 text-lg font-semibold" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <OrigemDinheiroSelect form={form} />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl><Textarea rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
          <Button type="submit" disabled={registrar.isPending}>
            {registrar.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
