
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

// Type for insertion and update operations
interface SupabaseOperationOptions {
  successMessage?: string;
  idField?: string;
}

// Interface para resultado de operações para evitar recursão infinita
interface OperationResult<T> {
  success: boolean;
  data: T | null;
  error?: Error | null;
}

/**
 * Hook para operações CRUD no Supabase com tratamento de erro padronizado
 */
export function useSupabaseCRUD<T = Record<string, any>>(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our shared error handler
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Função comum para manipular o início e fim de cada operação
  // Usamos um tipo explícito de retorno para evitar inferência recursiva
  const performOperation = useCallback(async <R>(
    operation: () => Promise<R | null>,
    errorMessage: string
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      return await operation();
    } catch (error) {
      handleError(error, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Get all records
  const getAll = useCallback(async (options?: SupabaseCRUDOptions): Promise<T[] | null> => {
    return performOperation<T[]>(async () => {
      const { columns = '*' } = options || {};
      
      // Create base query
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters and ordering
      if (options) {
        query = buildSupabaseQuery(query, options);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as T[];
    }, `Não foi possível carregar dados de ${tableName}`);
  }, [tableName, performOperation]);

  // Get a record by ID
  // Definimos explicitamente o tipo de retorno para evitar recursão infinita
  const getById = useCallback(async (
    id: string, 
    options?: { columns?: string; idField?: string }
  ): Promise<T | null> => {
    return performOperation<T>(async () => {
      const { columns = '*', idField = 'id' } = options || {};
      
      const { data, error } = await supabase
        .from(tableName)
        .select(columns)
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      return data as T | null;
    }, `Não foi possível carregar o item de ${tableName}`);
  }, [tableName, performOperation]);

  // Create a new record
  const create = useCallback(async (
    data: Partial<T>,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    return performOperation<T>(async () => {
      const { successMessage = "Item criado com sucesso" } = options || {};
      
      // Usamos 'as any' apenas na interface com o Supabase para evitar problemas de tipo
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return result as T;
    }, `Não foi possível criar o item em ${tableName}`);
  }, [tableName, handleSuccess, performOperation]);

  // Update an existing record
  const update = useCallback(async (
    id: string, 
    data: Partial<T>, 
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    return performOperation<T>(async () => {
      const { 
        successMessage = "Item atualizado com sucesso",
        idField = 'id'
      } = options || {};
      
      // Usamos 'as any' apenas na interface com o Supabase
      const { error: updateError } = await supabase
        .from(tableName)
        .update(data as any)
        .eq(idField, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated record
      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      if (!result) {
        throw new Error(`Record not found after update: ${idField}=${id}`);
      }
      
      handleSuccess(successMessage);
      
      return result as T;
    }, `Não foi possível atualizar o item em ${tableName}`);
  }, [tableName, handleSuccess, performOperation]);

  // Delete a record
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ): Promise<boolean> => {
    return performOperation<boolean>(async () => {
      const { 
        successMessage = "Item excluído com sucesso",
        idField = 'id'
      } = options || {};
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return true;
    }, `Não foi possível excluir o item de ${tableName}`);
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
