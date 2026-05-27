
import { UseFormReturn } from "react-hook-form";
import { VehicleSelect as GenericVehicleSelect } from "@/components/forms/VehicleSelect";
import { useFleet } from "../../../context/FleetContext";
import { FuelFormData } from "../schemas/fuelEntrySchema";

interface VehicleSelectProps {
  form: UseFormReturn<FuelFormData>;
}

export function VehicleSelect({ form }: VehicleSelectProps) {
  const { vehicles } = useFleet();
  return (
    <GenericVehicleSelect 
      form={form}
      name="vehicleId"
      vehicles={vehicles}
      onVehicleChange={(_, vehicle) => {
        if (vehicle) {
          form.setValue("mileage", vehicle.mileage || 0);
        }
      }}
      placeholder="Selecione o veículo"
    />
  );
}
