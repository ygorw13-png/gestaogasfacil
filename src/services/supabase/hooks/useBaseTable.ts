
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName, QueryOptions } from "@/services/supabase/types";
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";
import { safeTypeConversion } from "../utils/typeConversions";

/**
 * Hook for managing data state from a Supabase table
 * This hook is intended to be used alongside useTableOperations
 */
export function useBaseTable<T extends Record<string, unknown>>(
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { handleError } = useSupabaseErrorHandler();
  
  // Function to fetch data from the table
  const fetchData = useCallback(async (
    options: QueryOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns, filters, orderBy, pagination } = options;
      
      // Start building the query
      let query = supabase.from(tableName).select(columns || '*');
      
      // Apply filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering if provided
      if (orderBy) {
        const { column, ascending = true } = orderBy;
        query = query.order(column, { ascending });
      }
      
      // Apply pagination if provided
      if (pagination) {
        const { page, pageSize } = pagination;
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);
      }
      
      // Execute the query
      const { data: fetchedData, error: responseError } = await query;
      
      if (responseError) {
        throw responseError;
      }
      
      // Use safeTypeConversion from the utilities
      const typedData = fetchedData ? fetchedData.map(item => safeTypeConversion<T>(item)) : [];
      setData(typedData);
      return typedData;
    } catch (error) {
      const errorMsg = toastMessages.fetchError || `Error fetching data from ${tableName}`;
      handleError(error, errorMsg);
      setError(error instanceof Error ? error : new Error(String(error)));
      return [];
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toastMessages.fetchError]);
  
  // Fetch data on mount if specified
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchData, fetchOnMount]);
  
  return {
    data,
    loading,
    error,
    fetchData,
    setData,
    setError,
    refresh: fetchData
  };
}
