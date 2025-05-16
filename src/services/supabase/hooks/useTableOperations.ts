
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";

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
  
  // Create operation with proper typing
  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: createdData, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select();
      
      if (error) throw error;
      
      // Handle the case when data is returned as an array (which is typical with Supabase)
      if (Array.isArray(createdData) && createdData.length > 0) {
        return createdData[0] as unknown as T;
      }
      
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
        .update(data as any)
        .eq(idField, id)
        .select();
      
      if (error) throw error;
      
      // Handle the case when data is returned as an array
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        return updatedData[0] as unknown as T;
      }
      
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
