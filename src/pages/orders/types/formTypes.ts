
import { z } from "zod";

export const formSchema = z.object({
  clientName: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome muito longo"),
  clientPhone: z.string()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos"),
  street: z.string()
    .min(3, "Endereço deve ter no mínimo 3 caracteres")
    .max(100, "Endereço muito longo"),
  number: z.string()
    .min(1, "Número é obrigatório")
    .max(10, "Número muito longo"),
  complement: z.string()
    .max(100, "Complemento muito longo")
    .optional(),
  neighborhood: z.string()
    .max(100, "Bairro muito longo")
    .optional(),
  gasP13: z.number()
    .min(0, "Quantidade não pode ser negativa")
    .max(99, "Quantidade muito alta")
    .optional(),
  gasP20: z.number()
    .min(0, "Quantidade não pode ser negativa")
    .max(99, "Quantidade muito alta")
    .optional(),
  gasP45: z.number()
    .min(0, "Quantidade não pode ser negativa")
    .max(99, "Quantidade muito alta")
    .optional(),
  water: z.number()
    .min(0, "Quantidade não pode ser negativa")
    .max(99, "Quantidade muito alta")
    .optional(),
  paymentMethod: z.string()
    .min(1, "Forma de pagamento é obrigatória"),
  observations: z.string()
    .max(500, "Observação muito longa")
    .optional(),
});

export type FormValues = z.infer<typeof formSchema>;
