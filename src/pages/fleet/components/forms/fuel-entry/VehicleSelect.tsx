
import { UseFormReturn } from "react-hook-form";
import { VehicleSelect as GenericVehicleSelect } from "@/components/forms/VehicleSelect";
import { mockVehicles } from "../../../data";
import { FuelFormData } from "../schemas/fuelEntrySchema";

interface VehicleSelectProps {
  form: UseFormReturn<FuelFormData>;
}

export function VehicleSelect({ form }: VehicleSelectProps) {
  return (
    <GenericVehicleSelect 
      form={form}
      name="vehicleId"
      vehicles={mockVehicles}
      onVehicleChange={(_, vehicle) => {
        if (vehicle) {
          form.setValue("mileage", vehicle.mileage || 0);
        }
      }}
      placeholder="Selecione o veículo"
    />
  );
}
