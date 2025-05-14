
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { ValidTableName } from "@/services/supabase/types";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";

/**
 * A foundational hook for interacting with Supabase tables
 * Provides state management and data fetching
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
  const [error, setError] = useState<Error | PostgrestError | null>(null);
  
  const { handleError } = useSupabaseErrorHandler();

  // Fetch data with optional filtering and sorting
  const fetchData = useCallback(async (options: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns = '*', filters, orderBy } = options;
      
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      // Break the recursive type chain by using a simpler approach
      const { data: responseData, error } = await query;
      
      if (error) throw error;

      // First cast to any[] to break the recursive type instantiation
      // Then cast to T[] for type safety
      const typedData: T[] = responseData as any[];
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
  }, [tableName, handleError, toastMessages.fetchError]);

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
    setError
  };
}
