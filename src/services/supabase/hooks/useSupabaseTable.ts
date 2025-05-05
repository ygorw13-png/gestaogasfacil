
import { ValidTableName, QueryOptions } from "../types";
import { useTableData } from "./useTableData";
import { useTableCRUD } from "./useTableCRUD";

/**
 * Combined hook for data loading and CRUD operations
 * This is the main entry point for Supabase table operations
 */
export function useSupabaseTable<T extends Record<string, any>>(
  tableName: ValidTableName,
  options: {
    fetchOnMount?: boolean;
    idField?: string;
    initialQueryOptions?: QueryOptions;
    toastMessages?: {
      fetchError?: string;
      createSuccess?: string;
      createError?: string;
      updateSuccess?: string;
      updateError?: string;
      deleteSuccess?: string;
      deleteError?: string;
    };
  } = {}
) {
  const {
    fetchOnMount = true,
    idField = 'id',
    initialQueryOptions,
    toastMessages = {}
  } = options;

  // Get data loading functionality
  const {
    data,
    loading: dataLoading,
    error,
    fetchData,
    setData,
    refresh
  } = useTableData<T>(tableName, {
    fetchOnMount,
    initialQueryOptions,
    toastMessages: {
      fetchError: toastMessages.fetchError
    }
  });

  // Get CRUD operations
  const {
    loading: crudLoading,
    getById,
    createRecord,
    updateRecord,
    deleteRecord
  } = useTableCRUD<T>(tableName, {
    idField,
    toastMessages: {
      createSuccess: toastMessages.createSuccess,
      createError: toastMessages.createError,
      updateSuccess: toastMessages.updateSuccess,
      updateError: toastMessages.updateError,
      deleteSuccess: toastMessages.deleteSuccess,
      deleteError: toastMessages.deleteError
    }
  });

  // Create state-updating versions of the CRUD operations
  const wrappedCreateRecord = async (record: Omit<T, 'id'>) => {
    const result = await createRecord(record);
    
    if (result.status === 'success' && result.data) {
      setData(prev => [...prev, result.data as T]);
    }
    
    return result;
  };

  const wrappedUpdateRecord = async (id: string | number, updates: Partial<T>) => {
    const result = await updateRecord(id, updates);
    
    if (result.status === 'success' && result.data) {
      setData(prev => 
        prev.map(item => 
          item[idField as keyof T] === id ? (result.data as T) : item
        )
      );
    }
    
    return result;
  };

  const wrappedDeleteRecord = async (id: string | number) => {
    const result = await deleteRecord(id);
    
    if (result.status === 'success') {
      setData(prev => prev.filter(item => item[idField as keyof T] !== id));
    }
    
    return result;
  };

  return {
    // Data state
    data,
    loading: dataLoading || crudLoading,
    error,
    
    // Basic operations
    fetchData,
    getById,
    
    // State-updating operations
    createRecord: wrappedCreateRecord,
    updateRecord: wrappedUpdateRecord,
    deleteRecord: wrappedDeleteRecord,
    
    // Convenience methods
    refresh,
    setData
  };
}
