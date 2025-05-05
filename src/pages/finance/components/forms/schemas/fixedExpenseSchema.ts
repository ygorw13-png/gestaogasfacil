
import { z } from "zod";

export const fixedExpenseSchema = z.object({
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  amount: z.coerce.number().min(0, "Valor não pode ser negativo"),
  dueDay: z.coerce.number().min(1, "Dia inválido").max(31, "Dia inválido"),
  lastPayment: z.date().optional(),
  notes: z.string().optional(),
});

export type FixedExpenseFormData = z.infer<typeof fixedExpenseSchema>;

export const expenseCategories = [
  { value: "aluguel", label: "Aluguel" },
  { value: "utilities", label: "Serviços Públicos (Água, Luz, Gás)" },
  { value: "internet", label: "Internet" },
  { value: "insurance", label: "Seguros" },
  { value: "subscription", label: "Assinaturas" },
  { value: "tax", label: "Impostos" },
  { value: "salary", label: "Salários" },
  { value: "other", label: "Outros" }
];
