
import { z } from "zod";

export const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  mileage: z.coerce.number().min(0, "Quilometragem não pode ser negativa"),
  fuelType: z.string().min(1, "Tipo de combustível é obrigatório"),
  liters: z.coerce.number().min(0, "Volume não pode ser negativo"),
  pricePerLiter: z.coerce.number().min(0, "Preço não pode ser negativo"),
  station: z.string().optional(),
  fullTank: z.boolean().default(true),
});

export type FuelFormData = z.infer<typeof fuelSchema>;
