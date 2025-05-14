
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

  // Define explicit input and output types to avoid recursive type inference
  interface QueryOptions {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }

  // Use explicit non-generic function signature
  const fetchData = useCallback(async (options?: QueryOptions): Promise<T[]> => {
    setLoading(true);
    setError(null);
  
    try {
      // Simple destructuring with defaults
      const columns = options?.columns || '*';
      const filters = options?.filters;
      const orderBy = options?.orderBy;
      
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering if provided
      if (orderBy) {
        query = query.order(orderBy.column, { 
          ascending: orderBy.ascending ?? true 
        });
      }
      
      // Execute the query
      const { data: rawData, error: queryError } = await query;
      
      if (queryError) throw queryError;
      
      // Safely convert rawData to T[] using a temporary unknown type
      // This breaks the recursive type inference chain
      const result = (rawData || []) as unknown as T[];
      
      setData(result);
      return result;
    } catch (error) {
      const errorMsg = toastMessages.fetchError || `Error loading data from ${tableName}`;
      handleError(error, errorMsg);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Return empty array with proper type casting
      return [] as unknown as T[];
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
