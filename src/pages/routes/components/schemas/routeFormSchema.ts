
import { z } from "zod";

export const routeFormSchema = z.object({
  driverId: z.string().min(1, "Selecione um motorista"),
  destination: z.string().min(3, "Destino deve ter pelo menos 3 caracteres"),
  departureTime: z.string().min(1, "Informe o horário de saída"),
  inventory: z.object({
    gasP13: z.number().min(0, "Quantidade não pode ser negativa"),
    gasP20: z.number().min(0, "Quantidade não pode ser negativa"),
    gasP45: z.number().min(0, "Quantidade não pode ser negativa"),
    water: z.number().min(0, "Quantidade não pode ser negativa"),
  }),
  promissoryNotesToCollect: z.array(z.string()).default([]),
  pontos: z
    .array(
      z.object({ pontoId: z.string(), nome: z.string(), cheios: z.number().min(0) })
    )
    .default([]),
  notes: z.string().optional(),
});

export type RouteFormSchema = z.infer<typeof routeFormSchema>;
