
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabaseService";
import { useSupabaseErrorHandler, buildSupabaseQuery } from "./useSupabaseHelpers";
import { PostgrestError } from "@supabase/supabase-js";

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

  // Function to set the loading state and perform an operation with error handling
  const performOperation = useCallback(async <R>(
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

  // Get all records
  const getAll = useCallback(async (options?: SupabaseCRUDOptions): Promise<T[]> => {
    const { columns = '*' } = options || {};
    
    // Create base query
    let query = supabase.from(tableName).select(columns);
    
    // Apply filters and ordering
    if (options) {
      query = buildSupabaseQuery(query, options);
    }
    
    const result = await performOperation<any[]>(async () => {
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }, `Não foi possível carregar dados de ${tableName}`);
    
    // Safe conversion from unknown to T[]
    return (result || []) as T[];
  }, [tableName, performOperation]);

  // Get a record by ID
  const getById = useCallback(async (
    id: string, 
    options?: { columns?: string; idField?: string }
  ): Promise<T | null> => {
    const { columns = '*', idField = 'id' } = options || {};
    
    const result = await performOperation<any>(async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(columns)
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }, `Não foi possível carregar o item de ${tableName}`);
    
    // Safe conversion from unknown to T or null
    return result as T | null;
  }, [tableName, performOperation]);

  // Create a new record
  const create = useCallback(async (
    data: Partial<T>,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { successMessage = "Item criado com sucesso" } = options || {};
    
    const result = await performOperation<any>(async () => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return result;
    }, `Não foi possível criar o item em ${tableName}`);
    
    // Safe conversion from unknown to T or null
    return result as T | null;
  }, [tableName, handleSuccess, performOperation]);

  // Update an existing record
  const update = useCallback(async (
    id: string, 
    data: Partial<T>, 
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    const { 
      successMessage = "Item atualizado com sucesso",
      idField = 'id'
    } = options || {};
    
    const result = await performOperation<any>(async () => {
      // Executar a atualização
      const { error: updateError } = await supabase
        .from(tableName)
        .update(data as any)
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
    
    // Safe conversion from unknown to T or null
    return result as T | null;
  }, [tableName, handleSuccess, performOperation]);

  // Delete a record
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ): Promise<boolean> => {
    const { 
      successMessage = "Item excluído com sucesso",
      idField = 'id'
    } = options || {};
    
    const success = await performOperation<boolean>(async () => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    }, `Não foi possível excluir o item de ${tableName}`);
    
    return success ?? false;
  }, [tableName, handleSuccess, performOperation]);

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
