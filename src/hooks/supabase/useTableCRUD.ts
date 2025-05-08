
import { useCallback } from "react";
import { ValidTableName } from "@/services/supabase/types";
import { useBaseTable } from "./useBaseTable";
import { useTableOperations } from "./useTableOperations";

/**
 * Combined hook that provides data state management and CRUD operations
 * This is a direct replacement for the original useBaseSupabaseTable
 */
export function useTableCRUD<T extends Record<string, unknown>>(
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
    getById,
    createItem,
    updateItem,
    deleteItem
  } = useTableOperations<T>(tableName, {
    idField,
    toastMessages: {
      createSuccess: toastMessages.createSuccess,
      updateSuccess: toastMessages.updateSuccess,
      deleteSuccess: toastMessages.deleteSuccess,
      fetchItemError: toastMessages.fetchItemError
    }
  });

  // Create wrapped versions of CRUD operations that update local state
  const addItem = useCallback(async (
    item: Record<string, unknown>,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const result = await createItem(item, {
      successMessage: options.successMessage,
      returnItem: true
    });
    
    if (result) {
      setData(prev => [...prev, result]);
    }
    
    return result;
  }, [createItem, setData]);

  const updateItemWithState = useCallback(async (
    id: string,
    updates: Record<string, unknown>,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const result = await updateItem(id, updates, {
      successMessage: options.successMessage,
      returnItem: true
    });
    
    if (result) {
      setData(prev => prev.map(item => 
        (item[idField as keyof T] === id ? result : item)
      ));
    }
    
    return result;
  }, [updateItem, setData, idField]);

  const deleteItemWithState = useCallback(async (
    id: string,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    const success = await deleteItem(id, options);
    
    if (success) {
      setData(prev => prev.filter(item => item[idField as keyof T] !== id));
    }
    
    return success;
  }, [deleteItem, setData, idField]);

  return {
    // Data state
    data,
    loading: tableLoading || operationsLoading,
    error,
    
    // Base operations
    fetchData,
    getById,
    
    // State-updating operations
    addItem,
    updateItem: updateItemWithState,
    deleteItem: deleteItemWithState,
    
    // Alias for fetchData for compatibility
    refresh: fetchData
  };
}
