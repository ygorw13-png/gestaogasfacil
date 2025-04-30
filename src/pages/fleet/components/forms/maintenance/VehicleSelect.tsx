
import { UseFormReturn } from "react-hook-form";
import { VehicleSelect as GenericVehicleSelect } from "@/components/forms/VehicleSelect";
import { mockVehicles } from "../../../data";
import { MaintenanceFormData } from "../schemas/maintenanceFormSchema";

interface VehicleSelectProps {
  form: UseFormReturn<MaintenanceFormData>;
}

export function VehicleSelect({ form }: VehicleSelectProps) {
  return (
    <GenericVehicleSelect 
      form={form}
      name="vehicleId"
      vehicles={mockVehicles}
      placeholder="Selecione o veículo"
    />
  );
}
