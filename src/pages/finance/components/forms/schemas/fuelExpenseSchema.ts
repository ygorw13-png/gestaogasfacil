
import { z } from "zod";

export const fuelExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  liters: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
  pricePerLiter: z.coerce.number().min(0, "Preço não pode ser negativo"),
  notes: z.string().optional(),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  totalAmount: z.coerce.number().min(0, "Valor total não pode ser negativo").optional(),
});

export type FuelExpenseFormData = z.infer<typeof fuelExpenseSchema>;
