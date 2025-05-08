
import { useCallback } from "react";
import { ValidTableName } from "@/services/supabase/types";
import { useSupabaseTable } from "./useSupabaseTable";
import { createErrorResponse, createSuccessResponse } from "../utils";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";

/**
 * Combined hook that provides data state management and CRUD operations
 */
export function useTableCRUD(
  tableName: ValidTableName,
  options: {
    idField?: string;
    fetchOnMount?: boolean;
    toastMessages?: {
      fetchError?: string;
      createSuccess?: string;
      updateSuccess?: string;
      deleteSuccess?: string;
      fetchItemError?: string;
    };
  } = {}
) {
  const {
    idField = 'id',
    fetchOnMount = true,
    toastMessages = {}
  } = options;

  // Use our base table hook for data state management
  const {
    data,
    loading: tableLoading,
    error,
    fetchData,
    setData,
    setError
  } = useSupabaseTable(tableName, {
    idField,
    fetchOnMount,
    toastMessages: {
      fetchError: toastMessages.fetchError
    }
  });

  const { handleError, handleSuccess } = useSupabaseErrorHandler();
  
  // Create a new item
  const createItem = useCallback(async (
    item: any,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    try {
      const { 
        successMessage = toastMessages.createSuccess || `Item added successfully`, 
        returnItem = true 
      } = options;
      
      const query = supabase.from(tableName).insert(item as any);
      
      const { data: result, error } = returnItem
        ? await query.select().single()
        : await query;
      
      if (error) throw error;
      
      if (returnItem && result) {
        setData(prev => [...prev, result]);
      }
      
      handleSuccess(successMessage);
      return returnItem ? result : null;
    } catch (error) {
      handleError(error, `Error adding item to ${tableName}`);
      return null;
    }
  }, [tableName, handleSuccess, handleError, toastMessages.createSuccess, setData]);

  // Update an item
  const updateItem = useCallback(async (
    id: string,
    updates: Record<string, any>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    try {
      const { 
        successMessage = toastMessages.updateSuccess || `Item updated successfully`, 
        returnItem = true 
      } = options;
      
      // First update the item
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates as any)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated item if requested
      if (returnItem) {
        const { data: result, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq(idField, id)
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        
        if (!result) {
          throw new Error(`Record not found after update: ${idField}=${id}`);
        }
        
        // Update local state
        setData(prev => prev.map(item => 
          item[idField] === id ? result : item
        ));
        
        handleSuccess(successMessage);
        return result;
      } else {
        handleSuccess(successMessage);
        return null;
      }
    } catch (error) {
      handleError(error, `Error updating item in ${tableName}`);
      return null;
    }
  }, [tableName, idField, handleSuccess, handleError, toastMessages.updateSuccess, setData]);

  // Delete an item
  const deleteItem = useCallback(async (
    id: string,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    try {
      const { successMessage = toastMessages.deleteSuccess || `Item deleted successfully` } = options;
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      // Update local state
      setData(prev => prev.filter(item => item[idField] !== id));
      
      handleSuccess(successMessage);
      return true;
    } catch (error) {
      handleError(error, `Error deleting item from ${tableName}`);
      return false;
    }
  }, [tableName, idField, handleSuccess, handleError, toastMessages.deleteSuccess, setData]);

  // Get a single item by ID
  const getById = useCallback(async (id: string) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      return result;
    } catch (error) {
      const errorMsg = toastMessages.fetchItemError || `Error fetching item from ${tableName}`;
      handleError(error, errorMsg);
      return null;
    }
  }, [tableName, idField, handleError, toastMessages.fetchItemError]);

  return {
    // Data state
    data,
    loading: tableLoading,
    error,
    
    // Base operations
    fetchData,
    getById,
    
    // CRUD operations
    addItem: createItem,
    updateItem,
    deleteItem,
    
    // Alias for fetchData for compatibility
    refresh: fetchData
  };
}
