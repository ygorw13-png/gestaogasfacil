
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";

// Simple type for returned data to avoid deep recursion
type GenericRecord = Record<string, any>;

/**
 * Hook for basic table operations with standardized error handling
 */
export function useTableOperations<T extends GenericRecord>(
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
  const { error, handleError, safeExecute } = useErrorHandler();
  
  // Create operation with proper typing
  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: createdData, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return createdData as unknown as T;
    } catch (err: any) {
      handleError(err, toastMessages.createError || `Error creating record in ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation with proper typing
  const update = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: updatedData, error } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as unknown as T;
    } catch (err: any) {
      handleError(err, toastMessages.updateError || `Error updating record in ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, toastMessages.updateError]);

  // Remove operation
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      return true;
    } catch (err: any) {
      handleError(err, toastMessages.deleteError || `Error deleting record from ${tableName}`);
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
