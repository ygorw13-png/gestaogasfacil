
import { z } from "zod";

// Schema para validação dos formulários de pedido
export const formSchema = z.object({
  clientName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  clientPhone: z.string()
    .min(10, "Número de telefone inválido")
    .max(11, "Número de telefone inválido")
    .regex(/^\d+$/, "Telefone deve conter apenas números"),
  street: z.string().min(3, "Endereço deve ter pelo menos 3 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  gasP13: z.number().int().min(0, "Quantidade inválida").max(99, "Quantidade máxima excedida"),
  gasP20: z.number().int().min(0, "Quantidade inválida").max(99, "Quantidade máxima excedida"),
  gasP45: z.number().int().min(0, "Quantidade inválida").max(99, "Quantidade máxima excedida"),
  water: z.number().int().min(0, "Quantidade inválida").max(99, "Quantidade máxima excedida"),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  saleValue: z.number().min(0).optional(),
  observations: z.string().optional(),
}).superRefine((data, ctx) => {
  const requiresValue = ["money", "credit", "debit", "pix"].includes(data.paymentMethod);
  if (requiresValue && (!data.saleValue || data.saleValue <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["saleValue"],
      message: "Informe o valor da venda",
    });
  }
});


// Tipo derivado do schema
export type FormValues = z.infer<typeof formSchema>;
