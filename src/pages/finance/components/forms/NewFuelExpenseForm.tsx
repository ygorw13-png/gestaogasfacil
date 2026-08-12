import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockVehicles } from "@/pages/fleet/data";
import { OrigemDinheiroSelect } from "@/components/forms/OrigemDinheiroSelect";
import { useRegistrarDespesa, type OrigemDinheiro } from "@/hooks/useDespesas";

const schema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  valor: z.coerce.number().positive("Informe o valor do abastecimento"),
  origem_dinheiro: z.enum(["caixa_portaria", "cofre", "banco", "pessoal", "promissoria_estabelecimento"]),
  data: z.string().min(1, "Informe a data"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { onSuccess: () => void }

export default function NewFuelExpenseForm({ onSuccess }: Props) {
  const registrar = useRegistrarDespesa();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: "",
      valor: 0,
      origem_dinheiro: "caixa_portaria" as OrigemDinheiro,
      data: new Date().toISOString().slice(0, 10),
      observacoes: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    const veiculo = mockVehicles.find(v => v.id === values.vehicleId);
    await registrar.mutateAsync({
      tipo: "combustivel",
      descricao: `Combustível - ${veiculo?.plate ?? "Veículo"}`,
      valor: values.valor,
      data: values.data,
      origem_dinheiro: values.origem_dinheiro,
      veiculo_id: values.vehicleId,
      veiculo_placa: veiculo?.plate,
      categoria: "combustivel",
      observacoes: values.observacoes || null,
    });
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Veículo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-semibold">Valor Total (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" className="border-primary/50 text-lg font-semibold" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        <OrigemDinheiroSelect form={form} />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl><Textarea placeholder="Posto, litros, etc (opcional)" rows={2} {...field} /></FormControl>
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
