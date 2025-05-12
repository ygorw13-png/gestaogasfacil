
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabaseService";
import { useSupabaseErrorHandler, buildSupabaseQuery } from "./useSupabaseHelpers";

interface SupabaseCRUDOptions {
  columns?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
}

// Type for insertion and update operations
interface SupabaseOperationOptions {
  successMessage?: string;
}

// Hook for CRUD operations on Supabase with standardized error handling
export function useSupabaseCRUD<T = Record<string, any>>(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our shared error handler
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Get all records
  const getAll = useCallback(async (options?: SupabaseCRUDOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns = '*' } = options || {};
      
      // Create base query
      let query: any = supabase.from(tableName).select(columns);
      
      // Use shared query builder
      if (options) {
        query = buildSupabaseQuery(query, options);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as T[];
    } catch (error) {
      return handleError(error, `Não foi possível carregar dados de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError]);

  // Get a record by ID
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
      
      return data as T | null;
    } catch (error) {
      return handleError(error, `Não foi possível carregar o item de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError]);

  // Create a new record
  const create = useCallback(async (
    data: Record<string, any>, 
    options?: SupabaseOperationOptions
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { successMessage = "Item criado com sucesso" } = options || {};
      
      // Use explicit any type to bypass complex type checking
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data as any)
        .select()
        .single();
      
      if (error) throw error;
      
      handleSuccess(successMessage);
      // Use a simpler approach for type casting
      return result as any as T;
    } catch (error) {
      return handleError(error, `Não foi possível criar o item em ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, handleSuccess]);

  // Update an existing record
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
      // Break the deep type instantiation by using any as an intermediate step
      return result as any as T;
    } catch (error) {
      return handleError(error, `Não foi possível atualizar o item em ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, handleSuccess]);

  // Delete a record
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
