
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

// Opções para operações de inserção e atualização
interface SupabaseOperationOptions {
  successMessage?: string;
  idField?: string;
}

/**
 * Hook para operações CRUD no Supabase com tratamento de erro padronizado
 */
export function useSupabaseCRUD<T extends Record<string, any>>(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our shared error handler
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Função genérica para executar operações com tratamento de erro unificado
  // Utiliza um tipo de retorno específico para evitar inferências recursivas profundas
  const performOperation = useCallback(<R>(
    operation: () => Promise<R>,
    errorMessage: string
  ): Promise<R> => {
    setLoading(true);
    setError(null);
    
    return new Promise<R>((resolve, reject) => {
      operation()
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          handleError(err, errorMessage);
          reject(err);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [handleError]);

  // Get all records - com tipo de retorno explícito
  const getAll = useCallback(async (options?: SupabaseCRUDOptions): Promise<T[]> => {
    try {
      const { columns = '*' } = options || {};
      
      // Create base query
      let query = supabase.from(tableName).select(columns);
      
      // Apply filters and ordering
      if (options) {
        query = buildSupabaseQuery(query, options);
      }
      
      const result = await performOperation(async () => {
        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
      }, `Não foi possível carregar dados de ${tableName}`);
      
      return result;
    } catch (error) {
      return [];
    }
  }, [tableName, performOperation]);

  // Get a record by ID - com tipo de retorno explícito
  const getById = useCallback(async (
    id: string, 
    options?: { columns?: string; idField?: string }
  ): Promise<T | null> => {
    try {
      const { columns = '*', idField = 'id' } = options || {};
      
      const result = await performOperation(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select(columns)
          .eq(idField, id)
          .maybeSingle();
        
        if (error) throw error;
        return data as T | null;
      }, `Não foi possível carregar o item de ${tableName}`);
      
      return result;
    } catch (error) {
      return null;
    }
  }, [tableName, performOperation]);

  // Create a new record - com tipo de retorno explícito
  const create = useCallback(async (
    data: Partial<T>,
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    try {
      const { successMessage = "Item criado com sucesso" } = options || {};
      
      const result = await performOperation(async () => {
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
      
      return result;
    } catch (error) {
      return null;
    }
  }, [tableName, handleSuccess, performOperation]);

  // Update an existing record - com tipo de retorno explícito
  const update = useCallback(async (
    id: string, 
    data: Partial<T>, 
    options?: SupabaseOperationOptions
  ): Promise<T | null> => {
    try {
      const { 
        successMessage = "Item atualizado com sucesso",
        idField = 'id'
      } = options || {};
      
      const result = await performOperation(async () => {
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
        return updatedData as T;
      }, `Não foi possível atualizar o item em ${tableName}`);
      
      return result;
    } catch (error) {
      return null;
    }
  }, [tableName, handleSuccess, performOperation]);

  // Delete a record - com tipo de retorno explícito
  const remove = useCallback(async (
    id: string, 
    options?: SupabaseOperationOptions
  ): Promise<boolean> => {
    try {
      const { 
        successMessage = "Item excluído com sucesso",
        idField = 'id'
      } = options || {};
      
      await performOperation(async () => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(idField, id);
        
        if (error) throw error;
        
        handleSuccess(successMessage);
        return true;
      }, `Não foi possível excluir o item de ${tableName}`);
      
      return true;
    } catch (error) {
      return false;
    }
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
