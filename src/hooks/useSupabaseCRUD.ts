
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabaseService";
import { useSupabaseErrorHandler } from "./useSupabaseHelpers";

interface SupabaseCRUDOptions {
  columns?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
}

// Options for operations that modify data
interface SupabaseOperationOptions {
  successMessage?: string;
  idField?: string;
}

/**
 * Hook for CRUD operations on Supabase with standardized error handling
 */
export function useSupabaseCRUD<T extends Record<string, any>>(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our shared error handler
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Simple operation executor with error handling
  const safeExecute = useCallback(async <R>(
    operation: () => Promise<R>,
    errorMessage: string
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      handleError(err, errorMessage);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

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
    
    const result = await safeExecute<any[]>(async () => {
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, `Não foi possível carregar dados de ${tableName}`);
    
    // Use a simple type assertion
    return (result || []) as T[];
  }, [tableName, safeExecute]);

  // Get a record by ID
  const getById = useCallback(async (
    id: string, 
    options?: { columns?: string; idField?: string }
  ): Promise<T | null> => {
    const { columns = '*', idField = 'id' } = options || {};
    
    const result = await safeExecute<any>(async () => {
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

  // Create a new record with more explicit typing
  const create = useCallback(async (
    data: any,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { successMessage = "Item criado com sucesso" } = options || {};
    
    const result = await safeExecute<any>(async () => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return result;
    }, `Não foi possível criar o item em ${tableName}`);
    
    return result as T | null;
  }, [tableName, handleSuccess, safeExecute]);

  // Update an existing record
  const update = useCallback(async (
    id: string, 
    data: any, 
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { 
      successMessage = "Item atualizado com sucesso",
      idField = 'id'
    } = options || {};
    
    const result = await safeExecute<any>(async () => {
      // Executar a atualização
      const { error: updateError } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Buscar o registro atualizado
      const { data: updatedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
          
      if (fetchError) throw fetchError;
      
      if (!updatedData) {
        throw new Error(`Record not found after update: ${idField}=${id}`);
      }
      
      handleSuccess(successMessage);
      return updatedData;
    }, `Não foi possível atualizar o item em ${tableName}`);
    
    return result as T | null;
  }, [tableName, handleSuccess, safeExecute]);

  // Delete a record
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ): Promise<boolean> => {
    const { 
      successMessage = "Item excluído com sucesso",
      idField = 'id'
    } = options || {};
    
    const success = await safeExecute<boolean>(async () => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    }, `Não foi possível excluir o item de ${tableName}`);
    
    return success ?? false;
  }, [tableName, handleSuccess, safeExecute]);

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove,
    resetError: () => setError(null)
  };
}
