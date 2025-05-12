
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

/**
 * Hook para operações CRUD no Supabase com tratamento de erro padronizado
 */
export function useSupabaseCRUD<T = Record<string, any>>(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our shared error handler
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Função comum para manipular o início e fim de cada operação
  const performOperation = useCallback(async <R>(
    operation: () => Promise<R>,
    errorMessage: string
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      return await operation();
    } catch (error) {
      // Corrigindo o retorno do handleError para null explicitamente
      handleError(error, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Get all records
  const getAll = useCallback(async (options?: SupabaseCRUDOptions) => {
    return performOperation(async () => {
      const { columns = '*' } = options || {};
      
      // Create base query
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters and ordering
      if (options) {
        query = buildSupabaseQuery(query, options);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Simplificado para evitar problemas de tipo
      return data as T[];
    }, `Não foi possível carregar dados de ${tableName}`);
  }, [tableName, performOperation]);

  // Get a record by ID
  const getById = useCallback(async (id: string, options?: { columns?: string; idField?: string }) => {
    return performOperation(async () => {
      const { columns = '*', idField = 'id' } = options || {};
      
      const { data, error } = await supabase
        .from(tableName)
        .select(columns)
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Usando type assertion mais simples
      return data as T;
    }, `Não foi possível carregar o item de ${tableName}`);
  }, [tableName, performOperation]);

  // Create a new record
  const create = useCallback(async (
    data: Record<string, any>, 
    options?: SupabaseOperationOptions
  ) => {
    return performOperation(async () => {
      const { successMessage = "Item criado com sucesso" } = options || {};
      
      // Usar any para evitar problemas de tipo com o Supabase
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      // Type assertion simplificada
      return result as T;
    }, `Não foi possível criar o item em ${tableName}`);
  }, [tableName, handleSuccess, performOperation]);

  // Update an existing record
  const update = useCallback(async (
    id: string, 
    data: Record<string, any>, 
    options?: SupabaseOperationOptions
  ) => {
    return performOperation(async () => {
      const { 
        successMessage = "Item atualizado com sucesso",
        idField = 'id'
      } = options || {};
      
      // First update - using any to bypass type checking
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
      
      // Type assertion simplificada
      return result as T;
    }, `Não foi possível atualizar o item em ${tableName}`);
  }, [tableName, handleSuccess, performOperation]);

  // Delete a record
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ) => {
    return performOperation(async () => {
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
