
import { InventoryItem, InventoryMovement } from "@/hooks/supabase/useInventory";
import { z } from "zod";

export const stockMovementSchema = z.object({
  product: z.string({
    required_error: "O produto é obrigatório",
  }),
  type: z.enum(["entrada", "saída", "ajuste"], {
    required_error: "O tipo de movimentação é obrigatório",
  }),
  quantity: z.coerce
    .number()
    .min(1, "A quantidade deve ser maior que 0")
    .max(1000, "A quantidade deve ser menor que 1000"),
  notes: z.string().optional(),
});

export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;

export interface StockMovementFormProps {
  onSubmit: (movement: InventoryMovement) => Promise<boolean>;
  inventoryItems: InventoryItem[];
}
