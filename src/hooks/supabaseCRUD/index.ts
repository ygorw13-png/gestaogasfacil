
import { useState } from "react";
import { ValidTableName } from "@/services/supabase/types";
import { useReadOperations } from "./useReadOperations";
import { useWriteOperations } from "./useWriteOperations";
import { useErrorHandling } from "./useErrorHandling";
import type { SupabaseCRUDReturn } from "./types";

/**
 * Combined hook for CRUD operations on Supabase with standardized error handling
 */
export function useSupabaseCRUD<T extends Record<string, any>>(
  tableName: ValidTableName
): SupabaseCRUDReturn<T> {
  const { loading, error, resetError } = useErrorHandling();
  const { getAll, getById } = useReadOperations<T>(tableName);
  const { create, update, remove } = useWriteOperations<T>(tableName);
  
  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove,
    resetError
  };
}

// Export all types and sub-hooks for direct imports
export * from "./types";
export { useReadOperations } from "./useReadOperations";
export { useWriteOperations } from "./useWriteOperations";
export { useErrorHandling } from "./useErrorHandling";
