
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
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

  // Using a simplified return type to avoid recursive type instantiation
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
      
      // Use a two-step casting approach to break the recursive type chain
      const { data: responseData, error: responseError } = await query;
      
      if (responseError) throw responseError;
      
      // First cast to unknown to break the recursive type chain
      // Then cast to T[] to ensure type safety for consumers
      const typedData = responseData as unknown as T[];
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
  }, [tableName, toastMessages.fetchError]);

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
