
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse, ValidTableName, QueryOptions } from "../types";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";
import { createSuccessResponse, createErrorResponse, applyFilters, applySorting, applyPagination } from "../utils";

/**
 * Hook for basic data fetching and state management
 */
export function useTableData<T extends Record<string, any>>(
  tableName: ValidTableName,
  options: {
    fetchOnMount?: boolean;
    initialQueryOptions?: QueryOptions;
    toastMessages?: {
      fetchError?: string;
    };
  } = {}
) {
  const {
    fetchOnMount = true,
    initialQueryOptions,
    toastMessages = {}
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  
  const { handleError } = useSupabaseErrorHandler();

  // Fixed type to avoid recursive type instantiation
  const fetchData = useCallback(async (queryOptions?: QueryOptions): Promise<ApiResponse<Record<string, any>[]>> => {
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
      
      // Apply filters, sorting, and pagination
      query = applyFilters(query, mergedOptions.filters);
      query = applySorting(query, mergedOptions.orderBy);
      query = applyPagination(query, mergedOptions.pagination);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const typedData = data as unknown as T[];
      setData(typedData);
      return createSuccessResponse(data as Record<string, any>[]);
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

  // Load data on component mount if enabled
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
    setData,
    setError,
    refresh: () => fetchData(initialQueryOptions)
  };
}
