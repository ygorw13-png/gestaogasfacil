
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { PostgrestError } from "@supabase/supabase-js";

// Define simple options interface
interface TableOperationsOptions {
  idField?: string;
  toastMessages?: {
    fetchError?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
  };
}

// Define simple result interface
interface TableOperationsResult<T> {
  loading: boolean;
  error: Error | null;
  create: (data: Record<string, unknown>) => Promise<T | null>;
  update: (id: string, data: Record<string, unknown>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
}

/**
 * Hook for basic table operations with standardized error handling
 */
export function useTableOperations<T>(
  tableName: ValidTableName,
  options: TableOperationsOptions = {}
): TableOperationsResult<T> {
  const {
    idField = 'id',
    toastMessages = {}
  } = options;

  const [loading, setLoading] = useState(false);
  const { error, handleError } = useErrorHandler();

  // Shared error handling function to avoid duplication
  const handleOperationError = useCallback((
    err: unknown, 
    defaultMessage: string
  ): null => {
    setLoading(false);
    handleError(err as Error | PostgrestError, defaultMessage);
    return null;
  }, [handleError]);

  // Create operation
  const create = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    
    try {
      // Use type assertion to fix type compatibility issues
      const { data: result, error: responseError } = await supabase
        .from(tableName)
        .insert(data as any)
        .select();
      
      setLoading(false);
      
      if (responseError) {
        throw responseError;
      }
      
      // Safely handle array response
      if (Array.isArray(result) && result.length > 0) {
        return result[0] as unknown as T;
      }
      
      return result as unknown as T;
    } catch (err) {
      return handleOperationError(
        err, 
        toastMessages.createError || `Error creating record in ${tableName}`
      );
    }
  }, [tableName, handleOperationError, toastMessages.createError]);

  // Update operation
  const update = useCallback(async (id: string, data: Record<string, unknown>) => {
    setLoading(true);
    
    try {
      // First update the record
      const { error: updateError } = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Then fetch the updated record
      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      setLoading(false);
      
      if (fetchError) {
        throw fetchError;
      }
      
      return result as unknown as T;
    } catch (err) {
      return handleOperationError(
        err, 
        toastMessages.updateError || `Error updating record in ${tableName}`
      );
    }
  }, [tableName, idField, handleOperationError, toastMessages.updateError]);

  // Remove operation
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      setLoading(false);
      
      if (deleteError) {
        throw deleteError;
      }
      
      return true;
    } catch (err) {
      handleOperationError(
        err, 
        toastMessages.deleteError || `Error deleting record from ${tableName}`
      );
      return false;
    }
  }, [tableName, idField, handleOperationError, toastMessages.deleteError]);

  return {
    loading,
    error,
    create,
    update,
    remove
  };
}
