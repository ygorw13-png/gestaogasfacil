
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { mockMaintenances, mockVehicles } from "../../data";
import { maintenanceSchema, maintenanceTypes, MaintenanceFormData } from "./schemas/maintenanceFormSchema";
import { VehicleSelect } from "./maintenance/VehicleSelect";
import { MaintenanceTypeSelect } from "./maintenance/MaintenanceTypeSelect";
import { MaintenanceDetails } from "./maintenance/MaintenanceDetails";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

interface NewMaintenanceFormProps {
  onSuccess: () => void;
}

export default function NewMaintenanceForm({ onSuccess }: NewMaintenanceFormProps) {
  const { toast } = useToast();
  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: "",
      type: "",
      description: "",
      scheduledDate: new Date(),
      estimatedCost: 0,
      priority: "medium",
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    try {
      const vehicle = mockVehicles.find(v => v.id === data.vehicleId);
      const typeLabel = maintenanceTypes.find(t => t.value === data.type)?.label || data.type;
      
      const newMaintenance = {
        id: `maintenance-${Date.now()}`,
        vehicleId: data.vehicleId,
        vehiclePlate: vehicle?.plate || 'Desconhecido',
        type: typeLabel,
        description: data.description || typeLabel,
        scheduledDate: data.scheduledDate,
        completionDate: null,
        estimatedCost: data.estimatedCost,
        actualCost: null,
        status: "scheduled",
        priority: data.priority,
        mileage: vehicle?.mileage || 0,
      };
      
      mockMaintenances.push(newMaintenance);
      toast({
        title: "Manutenção agendada",
        description: "A manutenção foi agendada com sucesso."
      });
      onSuccess();
    } catch (error) {
      console.error("Erro ao agendar manutenção:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao agendar a manutenção.",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VehicleSelect form={form} />
        <MaintenanceTypeSelect form={form} />
        <MaintenanceDetails form={form} />

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">Agendar</Button>
        </div>
      </form>
    </Form>
  );
}
