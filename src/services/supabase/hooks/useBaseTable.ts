
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "../types";
import { useErrorHandler } from "../utils/errorHandling";
import { QueryOptions, applyQueryOptions } from "../utils/queryBuilder";
import { safeArrayConversion } from "../utils/typeConversions";

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
  const { loading, error, handleError, safeExecute } = useErrorHandler({
    defaultErrorMessage: toastMessages.fetchError || `Error loading data from ${tableName}`
  });
  
  // Fetch data with standardized options and error handling
  const fetchData = useCallback(async (options?: QueryOptions): Promise<T[]> => {
    const columns = options?.columns ?? '*';
    
    // Create base query
    const baseQuery = supabase.from(tableName).select(columns);
    
    // Use shared query builder to apply filters, ordering, etc.
    const query = applyQueryOptions(baseQuery, options);
    
    // Execute the query with error handling
    const result = await safeExecute(async () => {
      const { data: rawData, error: queryError } = await query;
      if (queryError) throw queryError;
      return rawData || [];
    });
    
    // Use safe conversion and update state
    const typedResults = safeArrayConversion<T>(result || []);
    setData(typedResults);
    return typedResults;
  }, [tableName, safeExecute]);

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
    refresh: () => fetchData()
  };
}
