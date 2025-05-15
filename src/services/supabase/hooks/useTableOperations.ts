
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { useErrorHandler } from "../utils/errorHandling";
import { safeTypeConversion } from "../utils/typeConversions";

/**
 * Hook for CRUD operations on a Supabase table
 * Can be used standalone or with useBaseTable
 */
export function useTableOperations<T extends Record<string, unknown>>(
  tableName: ValidTableName,
  options: {
    idField?: string;
    toastMessages?: {
      createSuccess?: string;
      updateSuccess?: string;
      deleteSuccess?: string;
      fetchItemError?: string;
    };
  } = {}
) {
  const {
    idField = 'id',
    toastMessages = {}
  } = options;
  
  const { loading, setLoading, handleError, handleSuccess, safeExecute } = useErrorHandler();

  // Get a single item by ID
  const getById = useCallback(async (id: string) => {
    // Use safe type conversion to break recursive typing
    return await safeExecute(async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }, toastMessages.fetchItemError || `Error fetching item from ${tableName}`)
    .then(result => result ? (result as unknown as T) : null);
  }, [tableName, idField, safeExecute, toastMessages.fetchItemError]);

  // Create a new item
  const createItem = useCallback(async (
    item: Record<string, unknown>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    const { 
      successMessage = toastMessages.createSuccess || `Item added successfully`, 
      returnItem = true 
    } = options;
    
    const result = await safeExecute(async () => {
      const query = supabase.from(tableName).insert(item as any);
      
      const { data, error } = returnItem
        ? await query.select().single()
        : await query;
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return returnItem ? data : null;
    }, `Error adding item to ${tableName}`);
    
    // Use safe type conversion to break recursive typing
    return returnItem ? (result ? (result as unknown as T) : null) : null;
  }, [tableName, handleSuccess, safeExecute, toastMessages.createSuccess]);

  // Update an existing item
  const updateItem = useCallback(async (
    id: string,
    updates: Record<string, unknown>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    const { 
      successMessage = toastMessages.updateSuccess || `Item updated successfully`, 
      returnItem = true 
    } = options;
    
    const result = await safeExecute(async () => {
      // First update the item
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates as any)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated item if requested
      if (returnItem) {
        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq(idField, id)
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        
        if (!data) {
          throw new Error(`Record not found after update: ${idField}=${id}`);
        }
        
        handleSuccess(successMessage);
        return data;
      } else {
        handleSuccess(successMessage);
        return null;
      }
    }, `Error updating item in ${tableName}`);
    
    // Use safe type conversion to break recursive typing
    return returnItem ? (result ? (result as unknown as T) : null) : null;
  }, [tableName, idField, handleSuccess, safeExecute, toastMessages.updateSuccess]);

  // Delete an item
  const deleteItem = useCallback(async (
    id: string,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const { successMessage = toastMessages.deleteSuccess || `Item deleted successfully` } = options;
    
    const success = await safeExecute(async () => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    }, `Error deleting item from ${tableName}`);
    
    return success || false;
  }, [tableName, idField, handleSuccess, safeExecute, toastMessages.deleteSuccess]);

  return {
    loading,
    getById,
    createItem,
    updateItem,
    deleteItem
  };
}
