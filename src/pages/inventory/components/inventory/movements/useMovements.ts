
import { useMemo } from "react";
import { InventoryMovement } from "@/hooks/supabase/useInventory";

export function useSortedMovements(movements: InventoryMovement[]) {
  return useMemo(() => {
    return [...movements].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Sort from newest to oldest
    });
  }, [movements]);
}
