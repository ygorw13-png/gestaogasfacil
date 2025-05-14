
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

  // Using a simplified function signature to avoid recursive type issues
  const fetchData = useCallback(async (options?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const columns = options?.columns || '*';
      
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters if provided
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering if provided
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }
      
      const { data: rawData, error: responseError } = await query;
      
      if (responseError) throw responseError;
      
      // Use explicit type assertion to completely break the recursion
      const result = [] as T[];
      if (Array.isArray(rawData)) {
        rawData.forEach(item => result.push(item as T));
      }
      
      setData(result);
      return result;
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
