
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { PostgrestError } from "@supabase/supabase-js";
import { safeTypeConversion } from "../utils/typeConversions";

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

  // Create operation
  const create = useCallback(async (data: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    try {
      // Completely break the type chain by using any
      const { data: createdData, error: responseError } = await supabase
        .from(tableName)
        .insert(data as any)
        .select() as any;
      
      if (responseError) throw responseError;
      
      // Simple processing with direct type assertion
      const result = Array.isArray(createdData) && createdData.length > 0 
        ? createdData[0] 
        : createdData;
      
      // Use direct type casting to prevent deep instantiation
      return result ? (result as any) : null;
    } catch (err) {
      const errorMessage = toastMessages.createError || `Error creating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation
  const update = useCallback(async (id: string, data: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    try {
      // Use type assertion with 'any' throughout to prevent deep inference
      const response = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id)
        .select() as any;
      
      if (response.error) throw response.error;
      
      // Simple direct type casting of response data
      const updatedData = response.data;
      const result = Array.isArray(updatedData) && updatedData.length > 0 
        ? updatedData[0] 
        : updatedData;
      
      // Direct casting to any to break type recursion
      return result ? (result as any) : null;
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
