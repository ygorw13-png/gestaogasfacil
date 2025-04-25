
import { z } from "zod";

export const formSchema = z.object({
  clientName: z.string().min(1, "Nome do cliente é obrigatório"),
  clientPhone: z.string().min(1, "Telefone é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  gasP13: z.number().min(0, "Não pode ser negativo").optional(),
  gasP20: z.number().min(0, "Não pode ser negativo").optional(),
  gasP45: z.number().min(0, "Não pode ser negativo").optional(),
  water: z.number().min(0, "Não pode ser negativo").optional(),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  observations: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
