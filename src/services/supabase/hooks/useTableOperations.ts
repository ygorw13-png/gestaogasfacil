
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
  
  // Create operation with simplified typing
  const create = useCallback(async (data: Record<string, any>): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: createdData, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();
      
      if (error) throw error;
      
      if (Array.isArray(createdData) && createdData.length > 0) {
        return createdData[0] as T;
      }
      
      return (createdData || null) as T;
    } catch (err: any) {
      handleError(err, toastMessages.createError || `Error creating record in ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.createError]);

  // Update operation with simplified typing
  const update = useCallback(async (id: string, data: Record<string, any>): Promise<T | null> => {
    setLoading(true);
    try {
      const { data: updatedData, error } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
        .select();
      
      if (error) throw error;
      
      if (Array.isArray(updatedData) && updatedData.length > 0) {
        return updatedData[0] as T;
      }
      
      return (updatedData || null) as T;
    } catch (err: any) {
      handleError(err, toastMessages.updateError || `Error updating record in ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, toastMessages.updateError]);

  // Remove operation with explicit boolean return
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
