
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";
import { safeTypeConversion } from "../utils/typeConversions";

type ToastMessages = {
  createSuccess?: string;
  updateSuccess?: string;
  deleteSuccess?: string;
  fetchItemError?: string;
};

type TableOperationOptions = {
  idField?: string;
  toastMessages?: ToastMessages;
};

type ReturnItemOptions = {
  successMessage?: string;
  returnItem?: boolean;
};

type DeleteItemOptions = {
  successMessage?: string;
};

/**
 * Hook for CRUD operations on a Supabase table
 * Can be used standalone or with useBaseTable
 */
export function useTableOperations<T extends Record<string, unknown>>(
  tableName: ValidTableName,
  options: TableOperationOptions = {}
) {
  const {
    idField = 'id',
    toastMessages = {}
  } = options;
  
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useSupabaseErrorHandler();
  
  // Get a single item by ID
  const getById = useCallback(async (id: string): Promise<T | null> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Use safe type conversion to avoid recursive typing
      return data ? safeTypeConversion<T>(data) : null;
    } catch (error) {
      const errorMsg = toastMessages.fetchItemError || `Error fetching item from ${tableName}`;
      handleError(error, errorMsg);
      return null;
    }
  }, [tableName, idField, handleError, toastMessages.fetchItemError]);

  // Create a new item
  const createItem = useCallback(async (
    item: Record<string, unknown>,
    options: ReturnItemOptions = {}
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      const { 
        successMessage = toastMessages.createSuccess || `Item added successfully`, 
        returnItem = true 
      } = options;
      
      const { data: result, error: responseError } = await (supabase
        .from(tableName) as any)
        .insert(item)
        .select(returnItem ? '*' : '');
      
      if (responseError) {
        throw responseError;
      }
      
      handleSuccess(successMessage);
      
      if (returnItem && Array.isArray(result) && result.length > 0) {
        // Use safe type conversion
        return safeTypeConversion<T>(result[0]);
      }
      
      return null;
    } catch (error) {
      handleError(error, `Error adding item to ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, handleSuccess, toastMessages.createSuccess]);

  // Update an existing item
  const updateItem = useCallback(async (
    id: string,
    data: Record<string, unknown>,
    options: ReturnItemOptions = {}
  ): Promise<T | null> => {
    setLoading(true);
    
    try {
      const { 
        successMessage = toastMessages.updateSuccess || `Item updated successfully`, 
        returnItem = true 
      } = options;
      
      // Update the item
      const { error: updateError } = await (supabase
        .from(tableName) as any)
        .update(data)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated item if requested
      if (!returnItem) {
        handleSuccess(successMessage);
        return null;
      }
      
      // Fetch the updated record
      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      if (!result) {
        throw new Error(`Record not found after update: ${idField}=${id}`);
      }
      
      handleSuccess(successMessage);
      
      // Use safe type conversion
      return safeTypeConversion<T>(result);
    } catch (err) {
      handleError(err, `Error updating item in ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, handleSuccess, toastMessages.updateSuccess]);

  // Delete an item
  const deleteItem = useCallback(async (
    id: string,
    options: DeleteItemOptions = {}
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      const { successMessage = toastMessages.deleteSuccess || `Item deleted successfully` } = options;
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    } catch (error) {
      handleError(error, `Error deleting item from ${tableName}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, handleSuccess, toastMessages.deleteSuccess]);

  return {
    loading,
    getById,
    createItem,
    updateItem,
    deleteItem
  };
}
