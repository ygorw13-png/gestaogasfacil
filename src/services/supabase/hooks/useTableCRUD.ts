
import { useCallback } from "react";
import { ValidTableName } from "@/services/supabase/types";
import { useBaseTable } from "./useBaseTable";
import { useTableOperations } from "./useTableOperations";
import { updateItemInArray, addItemToArray, removeItemFromArray } from "../utils/typeConversions";

// Options interface for improved readability
interface TableCRUDOptions {
  idField?: string;
  fetchOnMount?: boolean;
  toastMessages?: {
    fetchError?: string;
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
    fetchItemError?: string;
  };
}

/**
 * Combined hook that provides data state management and CRUD operations
 * This is a direct replacement for the original useBaseSupabaseTable
 */
export function useTableCRUD<T extends Record<string, unknown>>(
  tableName: ValidTableName,
  options: TableCRUDOptions = {}
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
    setData
  } = useBaseTable<T>(tableName, {
    idField,
    fetchOnMount,
    toastMessages: {
      fetchError: toastMessages.fetchError
    }
  });

  // Use our operations hook for CRUD operations
  const {
    loading: operationsLoading,
    create,
    update,
    remove
  } = useTableOperations<T>(tableName, {
    idField,
    toastMessages: {
      createError: toastMessages.createSuccess,
      updateError: toastMessages.updateSuccess,
      deleteError: toastMessages.deleteSuccess
    }
  });

  // Create wrapped versions of CRUD operations that update local state
  const addItem = useCallback(async (
    item: Record<string, unknown>,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const result = await create(item as Partial<T>);
    
    if (result) {
      // Use our shared array utility
      setData(prev => addItemToArray(prev, result));
    }
    
    return result;
  }, [create, setData]);

  const updateItemWithState = useCallback(async (
    id: string,
    updates: Record<string, unknown>,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const result = await update(id, updates as Partial<T>);
    
    if (result) {
      // Use our shared array utility
      setData(prev => updateItemInArray(prev, result, idField));
    }
    
    return result;
  }, [update, setData, idField]);

  const deleteItemWithState = useCallback(async (
    id: string,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const success = await remove(id);
    
    if (success) {
      // Use our shared array utility
      setData(prev => removeItemFromArray(prev, id, idField));
    }
    
    return success;
  }, [remove, setData, idField]);

  return {
    // Data state
    data,
    loading: tableLoading || operationsLoading,
    error,
    
    // Base operations
    fetchData,
    getAll: fetchData,
    
    // Create, Update, Delete operations
    create,
    update,
    remove,
    
    // State-updating operations
    addItem,
    updateItem: updateItemWithState,
    deleteItem: deleteItemWithState,
    
    // Alias for fetchData for compatibility
    refresh: fetchData
  };
}
