
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { VehicleSelection } from "./fuel/VehicleSelection";
import { FuelDetails } from "./fuel/FuelDetails";
import { NotesField } from "./fuel/NotesField";
import { fuelExpenseSchema, type FuelExpenseFormData } from "./schemas/fuelExpenseSchema";

interface NewFuelExpenseFormProps {
  onSuccess: () => void;
}

export default function NewFuelExpenseForm({ onSuccess }: NewFuelExpenseFormProps) {
  const form = useForm<FuelExpenseFormData>({
    resolver: zodResolver(fuelExpenseSchema),
    defaultValues: {
      vehicleId: "",
      liters: 0,
      pricePerLiter: 0,
      notes: "",
    },
  });

  const onSubmit = async (values: FuelExpenseFormData) => {
    // TODO: Implementar lógica de salvamento
    console.log(values);
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VehicleSelection form={form} />
        <FuelDetails form={form} />
        <NotesField form={form} />

        <div className="flex justify-end gap-2">
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
