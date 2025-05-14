
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";

/**
 * Hook for basic data fetching and state management
 */
export function useBaseTable<T extends Record<string, any>>(
  tableName: ValidTableName,
  options: {
    idField?: string;
    fetchOnMount?: boolean;
    toastMessages?: {
      fetchError?: string;
    };
  } = {}
) {
  const {
    idField = 'id',
    fetchOnMount = true,
    toastMessages = {}
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  
  const { handleError } = useSupabaseErrorHandler();

  // Using a callback with simpler types to avoid recursive type instantiation
  const fetchData = useCallback(async (queryOptions?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Merge with initial query options if provided
      const mergedOptions = queryOptions || {};
      const { columns = '*' } = mergedOptions;
      
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters
      if (mergedOptions.filters) {
        Object.entries(mergedOptions.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering
      if (mergedOptions.orderBy) {
        query = query.order(mergedOptions.orderBy.column, { 
          ascending: mergedOptions.orderBy.ascending ?? true 
        });
      }
      
      const { data: rawData, error: responseError } = await query;
      
      if (responseError) throw responseError;
      
      // Cast to any[] first, completely breaking the recursive type chain
      // Then cast to the expected type T[]
      const typedData = (rawData as any[]) as T[];
      setData(typedData);
      return typedData;
    } catch (error) {
      const errorMsg = toastMessages.fetchError || `Error loading data from ${tableName}`;
      handleError(error, errorMsg);
      setError(error instanceof Error ? error : new Error(String(error)));
      return [] as T[];
    } finally {
      setLoading(false);
    }
  }, [tableName, toastMessages.fetchError, handleError]);

  // Load data on component mount if enabled
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount, fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    setData,
    setError,
    refresh: () => fetchData()
  };
}
