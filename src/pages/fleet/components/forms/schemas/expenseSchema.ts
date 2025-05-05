
import { z } from "zod";

export const expenseSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  type: z.enum(["fuel", "maintenance", "tax", "insurance", "other"]),
  amount: z.coerce.number().min(0, "Valor não pode ser negativo"),
  receipt: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

export const expenseTypes = [
  { value: "fuel", label: "Combustível" },
  { value: "maintenance", label: "Manutenção" },
  { value: "tax", label: "Impostos/Taxas" },
  { value: "insurance", label: "Seguros" },
  { value: "other", label: "Outros" }
];
