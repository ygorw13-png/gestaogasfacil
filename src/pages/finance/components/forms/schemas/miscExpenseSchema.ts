
import { z } from "zod";

export const miscExpenseSchema = z.object({
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  category: z.string().min(1, "Categoria é obrigatória"),
  amount: z.coerce.number().min(0, "Valor não pode ser negativo"),
  date: z.date({
    required_error: "Data é obrigatória",
  }),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  notes: z.string().optional(),
});

export type MiscExpenseFormData = z.infer<typeof miscExpenseSchema>;

export const expenseCategories = [
  { value: "office", label: "Material de Escritório" },
  { value: "cleaning", label: "Material de Limpeza" },
  { value: "food", label: "Alimentação" },
  { value: "travel", label: "Viagens" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Outros" }
];

export const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "debito", label: "Cartão de Débito" },
  { value: "pix", label: "Pix" },
  { value: "transferencia", label: "Transferência" },
  { value: "outros", label: "Outros" }
];
