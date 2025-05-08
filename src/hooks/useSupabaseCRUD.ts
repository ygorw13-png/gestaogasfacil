
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabaseService";
import { useSupabaseErrorHandler, buildSupabaseQuery } from "./useSupabaseHelpers";

// Hook reutilizável para operações CRUD no Supabase com tratamento de erro padronizado
export function useSupabaseCRUD(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our shared error handler
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Buscar todos os registros
  const getAll = useCallback(async (options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns = '*' } = options || {};
      
      // Create base query
      let query = supabase.from(tableName).select(columns);
      
      // Use shared query builder
      query = buildSupabaseQuery(query, options);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as Record<string, any>[];
    } catch (error) {
      return handleError(error, `Não foi possível carregar dados de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError]);

  // Buscar um registro pelo ID
  const getById = useCallback(async (id: string, options?: { columns?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns = '*' } = options || {};
      
      const { data, error } = await supabase
        .from(tableName)
        .select(columns)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      return data as Record<string, any>;
    } catch (error) {
      return handleError(error, `Não foi possível carregar o item de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError]);

  // Criar um novo registro
  const create = useCallback(async (data: any, options?: { successMessage?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { successMessage = "Item criado com sucesso" } = options || {};
      
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      return result as Record<string, any>;
    } catch (error) {
      return handleError(error, `Não foi possível criar o item em ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, handleSuccess]);

  // Atualizar um registro existente
  const update = useCallback(async (
    id: string, 
    data: Record<string, any>, 
    options?: { 
      successMessage?: string;
      idField?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { 
        successMessage = "Item atualizado com sucesso",
        idField = 'id'
      } = options || {};
      
      // First update
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
      return result as Record<string, any>;
    } catch (error) {
      return handleError(error, `Não foi possível atualizar o item em ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, handleSuccess]);

  // Excluir um registro
  const remove = useCallback(async (
    id: string, 
    options?: { 
      successMessage?: string;
      idField?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
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
    } catch (error) {
      return handleError(error, `Não foi possível excluir o item de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, handleSuccess]);

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
