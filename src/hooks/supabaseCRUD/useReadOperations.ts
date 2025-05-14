
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { SupabaseCRUDOptions } from "./types";
import { useErrorHandling } from "./useErrorHandling";

/**
 * Hook providing read operations for a Supabase table
 */
export function useReadOperations<T>(tableName: ValidTableName) {
  const { safeExecute } = useErrorHandling();

  // Get all records with simpler type casting
  const getAll = useCallback(async (options?: SupabaseCRUDOptions): Promise<T[]> => {
    const { columns = '*' } = options || {};
    
    // Create base query
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
      const { column, ascending = true } = options.orderBy;
      query = query.order(column, { ascending });
    }
    
    const result = await safeExecute<unknown[]>(async () => {
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, `Não foi possível carregar dados de ${tableName}`);
    
    // Use a simple type assertion without generic parameter
    return (result || []) as T[];
  }, [tableName, safeExecute]);

  // Get a record by ID
  const getById = useCallback(async (
    id: string, 
    options?: { columns?: string; idField?: string }
  ): Promise<T | null> => {
    const { columns = '*', idField = 'id' } = options || {};
    
    const result = await safeExecute<unknown>(async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(columns)
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }, `Não foi possível carregar o item de ${tableName}`);
    
    return result as T | null;
  }, [tableName, safeExecute]);

  return {
    getAll,
    getById
  };
}
