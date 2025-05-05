
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { VehicleSelection } from "./expense/VehicleSelection";
import { DateSelection } from "./expense/DateSelection";
import { ExpenseTypeSelection } from "./expense/ExpenseTypeSelection";
import { ExpenseDetails } from "./expense/ExpenseDetails";
import { expenseSchema, type ExpenseFormData } from "./schemas/expenseSchema";
import { mockVehicles, mockVehicleExpenses } from "../../data";

interface NewExpenseFormProps {
  onSuccess: () => void;
}

export default function NewExpenseForm({ onSuccess }: NewExpenseFormProps) {
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

  const onSubmit = (data: ExpenseFormData) => {
    // Em um ambiente real, enviaríamos para o backend
    const vehicle = mockVehicles.find(v => v.id === data.vehicleId);
    
    const newExpense = {
      id: `expense-${Date.now()}`,
      vehicleId: data.vehicleId,
      vehiclePlate: vehicle?.plate || 'Desconhecido',
      date: data.date,
      description: data.description,
      type: data.type,
      amount: data.amount,
      receipt: data.receipt,
    };
    
    mockVehicleExpenses.push(newExpense);
    
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
