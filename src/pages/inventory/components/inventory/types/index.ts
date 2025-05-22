
import { InventoryItem, InventoryMovement } from "@/hooks/supabase/useInventory";

export type { InventoryItem, InventoryMovement };

export interface InventoryAppProps {
  className?: string;
}

export interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  error?: Error | null;
}

export interface MovementsHistoryProps {
  movements: InventoryMovement[];
  isLoading?: boolean;
  error?: Error | null;
}

export interface StockMovementFormProps {
  onSubmit: (movement: InventoryMovement) => Promise<boolean>;
  inventoryItems: InventoryItem[];
  isLoading?: boolean;
}
