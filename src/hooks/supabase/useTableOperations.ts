
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { useSupabaseErrorHandler } from "../useSupabaseHelpers";

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
  
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Get a single item by ID
  const getById = useCallback(async (id: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      return data as T;
    } catch (error) {
      const errorMsg = toastMessages.fetchItemError || `Error fetching item from ${tableName}`;
      handleError(error, errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, toastMessages.fetchItemError]);

  // Create a new item
  const createItem = useCallback(async (
    item: Partial<T>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    setLoading(true);
    
    try {
      const { 
        successMessage = toastMessages.createSuccess || `Item added successfully`, 
        returnItem = true 
      } = options;
      
      const query = supabase.from(tableName).insert(item);
      
      const { data, error } = returnItem
        ? await query.select().single()
        : await query;
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return returnItem ? (data as T) : null;
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
    updates: Partial<T>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    setLoading(true);
    
    try {
      const { 
        successMessage = toastMessages.updateSuccess || `Item updated successfully`, 
        returnItem = true 
      } = options;
      
      // First update the item
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
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
        return data as T;
      } else {
        handleSuccess(successMessage);
        return null;
      }
    } catch (error) {
      handleError(error, `Error updating item in ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, handleSuccess, toastMessages.updateSuccess]);

  // Delete an item
  const deleteItem = useCallback(async (
    id: string,
    options: {
      successMessage?: string;
    } = {}
  ) => {
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
