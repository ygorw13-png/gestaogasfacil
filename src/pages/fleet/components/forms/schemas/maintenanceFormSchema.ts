
import { z } from "zod";

export const maintenanceTypes = [
  { value: "oil-change", label: "Troca de Óleo" },
  { value: "brake-service", label: "Revisão de Freios" },
  { value: "tire-replacement", label: "Troca de Pneus" },
  { value: "periodic-review", label: "Revisão Periódica" },
  { value: "battery-replacement", label: "Troca de Bateria" },
  { value: "air-filter", label: "Filtro de Ar" },
  { value: "ac-service", label: "Ar Condicionado" },
  { value: "engine-repair", label: "Reparo do Motor" },
  { value: "electrical", label: "Sistema Elétrico" },
  { value: "other", label: "Outros" },
];

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  description: z.string().optional(),
  scheduledDate: z.date({
    required_error: "Data é obrigatória",
  }),
  estimatedCost: z.coerce.number().min(0, "Custo não pode ser negativo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;
