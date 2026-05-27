
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { VehicleSelection } from "./expense/VehicleSelection";
import { DateSelection } from "./expense/DateSelection";
import { ExpenseTypeSelection } from "./expense/ExpenseTypeSelection";
import { ExpenseDetails } from "./expense/ExpenseDetails";
import { expenseSchema, type ExpenseFormData } from "./schemas/expenseSchema";
import { useFleet } from "../../context/FleetContext";

interface NewExpenseFormProps {
  onSuccess: () => void;
}

export default function NewExpenseForm({ onSuccess }: NewExpenseFormProps) {
  const { vehicles, addExpense } = useFleet();
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: "",
      date: new Date(),
      description: "",
      type: "other",
      amount: 0,
      receipt: "",
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    const vehicle = vehicles.find(v => v.id === data.vehicleId);
    await addExpense({
      vehiclePlate: vehicle?.plate || "",
      date: (data.date instanceof Date ? data.date : new Date(data.date)).toISOString().split("T")[0],
      description: data.description,
      type: data.type as any,
      amount: data.amount,
      notes: data.receipt || undefined,
    });
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VehicleSelection form={form} />

        <div className="grid grid-cols-2 gap-4">
          <DateSelection form={form} />
          <ExpenseTypeSelection form={form} />
        </div>

        <ExpenseDetails form={form} />

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
