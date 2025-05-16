
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Hook for basic table operations with standardized error handling
 */
export function useTableOperations<T extends Record<string, any>>(
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
  
  // Helper function to safely process response data
  const processResponseData = (data: any): T | null => {
    if (!data) return null;
    
    if (Array.isArray(data)) {
      return data.length > 0 ? (data[0] as unknown as T) : null;
    }
    
    return data as unknown as T;
  };
  
  // Create operation with proper typing
  const create = useCallback(async (data: any): Promise<T | null> => {
    setLoading(true);
    try {
      // Use 'as any' to bypass TypeScript's strict checking for Supabase insert
      const { data: createdData, error: responseError } = await supabase
        .from(tableName)
        .insert(data)
        .select();
      
      if (responseError) throw responseError;
      
      return processResponseData(createdData);
    } catch (err: unknown) {
      const errorMessage = toastMessages.createError || `Error creating record in ${tableName}`;
      handleError(err as Error | PostgrestError, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation with proper typing
  const update = useCallback(async (id: string, data: any): Promise<T | null> => {
    setLoading(true);
    try {
      // Use 'as any' to bypass TypeScript's strict checking for Supabase update
      const { data: updatedData, error: responseError } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
        .select();
      
      if (responseError) throw responseError;
      
      return processResponseData(updatedData);
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
