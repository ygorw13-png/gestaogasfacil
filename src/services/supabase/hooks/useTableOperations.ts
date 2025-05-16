
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";

// Generic table record type
interface GenericRecord {
  [key: string]: any;
}

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
  const { error, handleError } = useErrorHandler();
  
  // Create operation with proper typing
  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    setLoading(true);
    try {
      // Cast the data to any to bypass the strict type checking
      // since Supabase's types are complex and specific to each table
      const { data: createdData, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      return createdData as T;
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
      // Cast to any to bypass strict type checking
      const { data: updatedData, error } = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as T;
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
