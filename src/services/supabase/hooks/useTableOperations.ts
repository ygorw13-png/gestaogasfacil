
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Hook for basic table operations with standardized error handling
 */
export function useTableOperations<T>(
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

  // Helper to safely convert data to the generic type T
  const safeConvert = (data: any): T | null => {
    if (!data) return null;
    return data as unknown as T;
  };

  // Create operation
  const create = useCallback(async (data: any): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: createdData, error: responseError } = await supabase
        .from(tableName)
        .insert(data)
        .select();
      
      if (responseError) throw responseError;
      
      // Process the response based on whether it's an array or single object
      if (Array.isArray(createdData)) {
        return createdData.length > 0 ? safeConvert(createdData[0]) : null;
      }
      
      return safeConvert(createdData);
    } catch (err) {
      const errorMessage = toastMessages.createError || `Error creating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation
  const update = useCallback(async (id: string, data: any): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: updatedData, error: responseError } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
        .select();
      
      if (responseError) throw responseError;
      
      // Process the response based on whether it's an array or single object
      if (Array.isArray(updatedData)) {
        return updatedData.length > 0 ? safeConvert(updatedData[0]) : null;
      }
      
      return safeConvert(updatedData);
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
