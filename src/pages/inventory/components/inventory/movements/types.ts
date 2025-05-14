
import { InventoryMovement } from "@/hooks/supabase/useInventory";

export interface MovementsHistoryProps {
  movements: InventoryMovement[];
}

export type MovementBadgeVariant = "default" | "secondary" | "destructive";
