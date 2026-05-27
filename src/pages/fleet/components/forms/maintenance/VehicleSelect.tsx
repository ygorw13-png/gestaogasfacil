
import { UseFormReturn } from "react-hook-form";
import { VehicleSelect as GenericVehicleSelect } from "@/components/forms/VehicleSelect";
import { useFleet } from "../../../context/FleetContext";
import { MaintenanceFormData } from "../schemas/maintenanceFormSchema";

interface VehicleSelectProps {
  form: UseFormReturn<MaintenanceFormData>;
}

export function VehicleSelect({ form }: VehicleSelectProps) {
  const { vehicles } = useFleet();
  return (
    <GenericVehicleSelect 
      form={form}
      name="vehicleId"
      vehicles={vehicles}
      placeholder="Selecione o veículo"
    />
  );
}
