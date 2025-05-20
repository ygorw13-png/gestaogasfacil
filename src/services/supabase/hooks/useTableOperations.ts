
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { PostgrestError } from "@supabase/supabase-js";

// Define simplified interfaces to break circular type dependencies
interface TableOperationsOptions {
  idField?: string;
  toastMessages?: {
    fetchError?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
  };
}

interface TableOperationsResult<T> {
  loading: boolean;
  error: Error | null;
  create: (data: Record<string, unknown>) => Promise<T | null>;
  update: (id: string, data: Record<string, unknown>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
}

/**
 * Hook for basic table operations with standardized error handling
 * Completely refactored to eliminate complex type instantiations
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

  // Create operation with simplified type handling
  const create = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Explicitly use any type to break any potential type recursion
      const response: any = await supabase
        .from(tableName)
        .insert(data as any)
        .select();
      
      if (response.error) throw response.error;
      
      // Extract result with minimal type handling
      const rawResult = response.data;
      
      // Simplest possible type handling - completely break the chain
      if (Array.isArray(rawResult) && rawResult.length > 0) {
        setLoading(false);
        return rawResult[0] as any as T;
      }
      
      setLoading(false);
      return rawResult as any as T;
    } catch (err) {
      setLoading(false);
      const errorMessage = toastMessages.createError || `Error creating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation with simplified type handling
  const update = useCallback(async (id: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      // First perform the update
      const updateResponse: any = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id);
      
      if (updateResponse.error) throw updateResponse.error;
      
      // Then fetch the updated record
      const fetchResponse: any = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .single();
      
      if (fetchResponse.error) throw fetchResponse.error;
      
      setLoading(false);
      // Return with explicit any cast to break type recursion
      return fetchResponse.data as any as T;
    } catch (err) {
      setLoading(false);
      const errorMessage = toastMessages.updateError || `Error updating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    }
  }, [tableName, idField, handleError, toastMessages.updateError]);

  // Remove operation with simplified type handling
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Explicitly type as any
      const response: any = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (response.error) throw response.error;
      
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      const errorMessage = toastMessages.deleteError || `Error deleting record from ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return false;
    }
  }, [tableName, idField, handleError, toastMessages.deleteError]);

  // Return with very explicit typing
  return {
    loading,
    error,
    create,
    update,
    remove
  };
}
