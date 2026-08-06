import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  priceP13: z.coerce.number().min(0, "Preço não pode ser negativo"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewResellerFormProps {
  onSubmit: (data: FormValues & { priceP20: number; priceP45: number; priceWater: number }) => void;
  isSubmitting?: boolean;
}

export function NewResellerForm({ onSubmit, isSubmitting }: NewResellerFormProps) {

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      contactPerson: "",
      priceP13: 80,
      notes: "",
    },
  });

  const handleSubmit = (data: FormValues) => {
    // Mantém compatibilidade com tipo Reseller
    onSubmit({ ...data, priceP20: 0, priceP45: 0, priceWater: 0 });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome do agregado" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="contactPerson" render={({ field }) => (
            <FormItem><FormLabel>Pessoa de Contato</FormLabel><FormControl><Input placeholder="Nome do responsável" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Endereço" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="priceP13" render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Preço P13 (R$)</FormLabel>
            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações adicionais" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="flex justify-end">
          <Button type="submit">Cadastrar Agregado</Button>
        </div>
      </form>
    </Form>
  );
}
