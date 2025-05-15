
import { ValidTableName } from "@/services/supabase/types";
import { useSupabaseCRUD as useSupabaseCRUDImplementation } from "./supabaseCRUD";

/**
 * Hook for CRUD operations on Supabase with standardized error handling
 * This is a wrapper around the implementation for backward compatibility
 */
export function useSupabaseCRUD<T extends Record<string, any>>(tableName: ValidTableName) {
  return useSupabaseCRUDImplementation<T>(tableName);
}
