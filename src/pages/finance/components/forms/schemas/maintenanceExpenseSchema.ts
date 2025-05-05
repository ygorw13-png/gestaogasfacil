
import { z } from "zod";

export const maintenanceExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  maintenanceType: z.string().min(1, "Tipo de manutenção é obrigatório"),
  amount: z.coerce.number().min(0, "Valor não pode ser negativo"),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  providerName: z.string().min(1, "Nome do prestador é obrigatório"),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type MaintenanceExpenseFormData = z.infer<typeof maintenanceExpenseSchema>;

export const maintenanceTypes = [
  { value: "preventive", label: "Preventiva" },
  { value: "corrective", label: "Corretiva" },
  { value: "revision", label: "Revisão" },
  { value: "emergency", label: "Emergencial" },
  { value: "other", label: "Outros" },
];
