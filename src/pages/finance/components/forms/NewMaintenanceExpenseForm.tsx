
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { VehicleSelection } from "./maintenance/VehicleSelection";
import { MaintenanceDetails } from "./maintenance/MaintenanceDetails";
import { DateAndProvider } from "./maintenance/DateAndProvider";
import { AdditionalInfo } from "./maintenance/AdditionalInfo";
import { 
  maintenanceExpenseSchema, 
  type MaintenanceExpenseFormData 
} from "./schemas/maintenanceExpenseSchema";

interface NewMaintenanceExpenseFormProps {
  onSuccess: () => void;
}

export default function NewMaintenanceExpenseForm({ onSuccess }: NewMaintenanceExpenseFormProps) {
  const { toast } = useToast();
  const form = useForm<MaintenanceExpenseFormData>({
    resolver: zodResolver(maintenanceExpenseSchema),
    defaultValues: {
      vehicleId: "",
      description: "",
      maintenanceType: "",
      amount: 0,
      date: new Date(),
      providerName: "",
      receiptNumber: "",
      notes: "",
    },
  });

  const onSubmit = (data: MaintenanceExpenseFormData) => {
    // Em um ambiente real, enviaríamos para o backend
    console.log("Despesa de manutenção cadastrada:", data);
    
    // Mostrar toast de sucesso
    toast({
      title: "Despesa de manutenção cadastrada",
      description: `Manutenção para o veículo foi adicionada com sucesso.`,
    });
    
    // Fechar o formulário
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VehicleSelection form={form} />
        <MaintenanceDetails form={form} />
        <DateAndProvider form={form} />
        <AdditionalInfo form={form} />

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
