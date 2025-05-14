
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

  // Define standalone type aliases to break recursive type inference
  type Filters = Record<string, any>;
  type SortOptions = { column: string; ascending?: boolean };
  
  // Define the fetchData function with explicit return type
  const fetchData = useCallback(async (options?: {
    columns?: string;
    filters?: Filters;
    orderBy?: SortOptions;
  }): Promise<T[]> => {
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
      
      // Break the type recursion with a two-step casting approach
      const intermediateData: any[] = rawData || [];
      const typedData = intermediateData as T[];
      
      setData(typedData);
      return typedData;
    } catch (error) {
      const errorMsg = toastMessages.fetchError || `Error loading data from ${tableName}`;
      handleError(error, errorMsg);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      // Return empty array with explicit type
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
