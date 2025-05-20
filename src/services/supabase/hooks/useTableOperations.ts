
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Hook for basic table operations with standardized error handling
 * Uses simplified type handling to prevent excessive type instantiation
 */
export function useTableOperations<T extends Record<string, unknown>>(
  tableName: ValidTableName,
  options: {
    idField?: string;
    toastMessages?: {
      fetchError?: string;
      createError?: string;
      updateError?: string;
      deleteError?: string;
    };
  } = {}
) {
  const {
    idField = 'id',
    toastMessages = {}
  } = options;

  const [loading, setLoading] = useState(false);
  const { error, handleError } = useErrorHandler();

  // Create operation with improved type safety
  const create = useCallback(async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript's static type checking for Supabase insert
      // This is necessary because Supabase expects specific table types but we're using a generic hook
      const response = await supabase
        .from(tableName)
        .insert(data as any)
        .select();
      
      if (response.error) throw response.error;
      
      // Simple result extraction
      const createdData = response.data;
      const result = Array.isArray(createdData) && createdData.length > 0 
        ? createdData[0] 
        : createdData;
      
      // Use type assertion to convert the result to the expected type
      return result as T;
    } catch (err) {
      const errorMessage = toastMessages.createError || `Error creating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation with improved type safety
  const update = useCallback(async (id: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript's static type checking for Supabase update
      const response = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id)
        .select();
      
      if (response.error) throw response.error;
      
      // Simple result extraction
      const updatedData = response.data;
      const result = Array.isArray(updatedData) && updatedData.length > 0 
        ? updatedData[0] 
        : updatedData;
      
      // Use type assertion to convert the result to the expected type
      return result as T;
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

  return {
    loading,
    error,
    create,
    update,
    remove
  };
}
