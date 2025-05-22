import { useMemo } from 'react';
import { InventoryMovement } from "@/hooks/supabase/useInventory";

/**
 * Hook that sorts inventory movements by created_at in descending order (newest first)
 * with improved error handling and date validation
 */
export function useSortedMovements(movements: InventoryMovement[]) {
  return useMemo(() => {
    if (!movements || movements.length === 0) {
      return [];
    }
    
    // Create a copy of the array to avoid mutating the original
    return [...movements].sort((a, b) => {
      // Handle null or undefined dates safely
      if (!a.created_at) return 1;  // Move items without dates to the end
      if (!b.created_at) return -1; // Move items without dates to the end
      
      // Compare dates if both exist
      try {
        // Parse dates to ensure they are valid
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        
        // Check if both dates are valid before comparing
        const isDateAValid = !isNaN(dateA.getTime());
        const isDateBValid = !isNaN(dateB.getTime());
        
        if (!isDateAValid && !isDateBValid) return 0;
        if (!isDateAValid) return 1;
        if (!isDateBValid) return -1;
        
        // Sort descending (newest first)
        return dateB.getTime() - dateA.getTime();
      } catch (e) {
        // In case of any date parsing error, keep original order
        console.error("Error comparing dates:", e, {a: a.created_at, b: b.created_at});
        return 0;
      }
    });
  }, [movements]);
}

// Export all hooks
export * from "./types";
