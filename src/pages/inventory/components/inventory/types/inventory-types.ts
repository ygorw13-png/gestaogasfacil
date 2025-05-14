
import { InventoryItem } from "@/hooks/supabase/useInventory";

export interface InventoryItemsTableProps {
  items: InventoryItem[];
}

export interface InventoryStatusBadgeProps {
  quantity: number;
  threshold?: number;
}

export interface EmptyTableRowProps {
  colSpan: number;
  message: string;
}
