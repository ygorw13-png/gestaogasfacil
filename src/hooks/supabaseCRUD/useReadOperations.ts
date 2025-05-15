
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { useErrorHandling } from "./useErrorHandling";
import { applyQueryOptions, QueryOptions } from "@/services/supabase/utils/queryBuilder";
import { safeTypeConversion, safeArrayConversion } from "@/services/supabase/utils/typeConversions";

/**
 * Hook providing read operations for a Supabase table
 */
export function useReadOperations<T>(tableName: ValidTableName) {
  const { safeExecute } = useErrorHandling();

  // Get all records with simplified typing
  const getAll = useCallback(async (options?: QueryOptions): Promise<T[]> => {
    const { columns = '*' } = options || {};
    
    // Create base query
    const baseQuery = supabase.from(tableName).select(columns);
    
    // Apply filters, ordering, etc. with our shared query builder
    const query = applyQueryOptions(baseQuery, options);
    
    const result = await safeExecute(async () => {
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, `Não foi possível carregar dados de ${tableName}`);
    
    // Use our shared type conversion utility to avoid recursive types
    return safeArrayConversion<T>(result || []);
  }, [tableName, safeExecute]);

  // Get a record by ID with simplified typing
  const getById = useCallback(async (
    id: string, 
    options?: { columns?: string; idField?: string }
  ): Promise<T | null> => {
    const { columns = '*', idField = 'id' } = options || {};
    
    const result = await safeExecute(async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(columns)
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }, `Não foi possível carregar o item de ${tableName}`);
    
    // Use shared type conversion utility
    return safeTypeConversion<T>(result);
  }, [tableName, safeExecute]);

  return {
    getAll,
    getById
  };
}
