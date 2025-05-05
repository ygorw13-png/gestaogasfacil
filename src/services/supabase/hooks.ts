
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse, ValidTableName, QueryOptions } from "./types";
import { useSupabaseErrorHandler, buildSupabaseQuery } from "@/hooks/useSupabaseHelpers";
import { createSuccessResponse, createErrorResponse } from "./utils";

/**
 * A reusable hook for interacting with Supabase tables
 * This hook provides basic CRUD operations with standardized error handling
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

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  const fetchData = useCallback(async (queryOptions?: QueryOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      // Merge with initial query options if provided
      const mergedOptions = {
        ...initialQueryOptions,
        ...queryOptions,
        filters: {
          ...(initialQueryOptions?.filters || {}),
          ...(queryOptions?.filters || {})
        }
      };

      const { columns = '*' } = mergedOptions || {};
      
      let query = supabase.from(tableName).select(columns);
      query = buildSupabaseQuery(query, mergedOptions);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setData(data as unknown as T[]);
      return createSuccessResponse(data as unknown as T[]);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      return createErrorResponse(
        error, 
        toastMessages.fetchError || `Error fetching data from ${tableName}`
      );
    } finally {
      setLoading(false);
    }
  }, [tableName, initialQueryOptions, toastMessages.fetchError]);

  const getById = useCallback(async (id: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      return createSuccessResponse(data as unknown as T);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      return createErrorResponse(
        error, 
        `Error fetching ${tableName} with id ${id}`
      );
    } finally {
      setLoading(false);
    }
  }, [tableName, idField]);

  const createRecord = useCallback(async (record: Omit<T, 'id'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      
      setData(prev => [...prev, data as unknown as T]);
      
      const successMsg = toastMessages.createSuccess || `${tableName} created successfully`;
      handleSuccess(successMsg);
      
      return createSuccessResponse(data as unknown as T);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      handleError(
        error, 
        toastMessages.createError || `Error creating ${tableName}`
      );
      return createErrorResponse(error, `Error creating ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, toastMessages.createSuccess, toastMessages.createError, handleSuccess, handleError]);

  const updateRecord = useCallback(async (id: string | number, updates: Partial<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      // First update
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated record
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      if (!data) {
        throw new Error(`Record not found after update: ${idField}=${id}`);
      }
      
      // Update local state
      setData(prev => 
        prev.map(item => 
          item[idField as keyof T] === id ? (data as unknown as T) : item
        )
      );
      
      const successMsg = toastMessages.updateSuccess || `${tableName} updated successfully`;
      handleSuccess(successMsg);
      
      return createSuccessResponse(data as unknown as T);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      handleError(
        error, 
        toastMessages.updateError || `Error updating ${tableName}`
      );
      return createErrorResponse(error, `Error updating ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, toastMessages.updateSuccess, toastMessages.updateError, handleSuccess, handleError]);

  const deleteRecord = useCallback(async (id: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      // Update local state
      setData(prev => prev.filter(item => item[idField as keyof T] !== id));
      
      const successMsg = toastMessages.deleteSuccess || `${tableName} deleted successfully`;
      handleSuccess(successMsg);
      
      return createSuccessResponse(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      handleError(
        error, 
        toastMessages.deleteError || `Error deleting ${tableName}`
      );
      return createErrorResponse(error, `Error deleting ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, toastMessages.deleteSuccess, toastMessages.deleteError, handleSuccess, handleError]);

  // Fetch data on component mount if fetchOnMount is true
  useEffect(() => {
    if (fetchOnMount) {
      fetchData(initialQueryOptions);
    }
  }, [fetchOnMount, fetchData, initialQueryOptions]);

  return {
    data,
    loading,
    error,
    fetchData,
    getById,
    createRecord,
    updateRecord,
    deleteRecord,
    refresh: () => fetchData(initialQueryOptions),
    setData
  };
}
