
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
  const create = useCallback(async (data: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    try {
      // Pass data as any to bypass TypeScript checking for Supabase insert
      const response = await supabase
        .from(tableName)
        .insert(data as any)
        .select();
      
      if (response.error) throw response.error;
      
      // Simple result extraction
      const result = response.data;
      const finalResult = Array.isArray(result) && result.length > 0 
        ? result[0] 
        : result;
      
      // Break type chain completely with double casting
      return finalResult as unknown as T;
    } catch (err) {
      const errorMessage = toastMessages.createError || `Error creating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation with simplified type handling
  const update = useCallback(async (id: string, data: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    try {
      // Pass data as any to bypass TypeScript checking for Supabase update
      const response = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id)
        .select();
      
      if (response.error) throw response.error;
      
      // Simple result extraction with minimal type manipulation
      const result = response.data;
      // Use as any to completely break the type chain
      let finalResult: any = null;
      
      if (Array.isArray(result) && result.length > 0) {
        finalResult = result[0];
      } else {
        finalResult = result;
      }
      
      // Return with explicit cast to requested type
      return finalResult as unknown as T;
    } catch (err) {
      const errorMessage = toastMessages.updateError || `Error updating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, toastMessages.updateError]);

  // Remove operation with explicit boolean return
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error: responseError } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (responseError) throw responseError;
      return true;
    } catch (err) {
      const errorMessage = toastMessages.deleteError || `Error deleting record from ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, toastMessages.deleteError]);

  // Return a simplified, explicitly typed result object
  return {
    loading,
    error,
    create,
    update,
    remove
  };
}
