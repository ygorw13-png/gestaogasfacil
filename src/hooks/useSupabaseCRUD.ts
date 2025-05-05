
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { PostgrestError } from "@supabase/supabase-js";
import { ValidTableName } from "@/services/supabaseService";

// Hook reutilizável para operações CRUD no Supabase com tratamento de erro padronizado
export function useSupabaseCRUD<T extends Record<string, any>>(tableName: ValidTableName) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const { toast } = useToast();

  // Função genérica para tratamento de erros
  const handleError = useCallback((error: unknown, message: string) => {
    console.error(`Erro em ${tableName}:`, error);
    setError(error instanceof PostgrestError ? error : new Error(String(error)));
    
    toast({
      title: "Erro",
      description: message,
      variant: "destructive"
    });
    
    return null;
  }, [tableName, toast]);

  // Buscar todos os registros
  const getAll = useCallback(async (options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns = '*', filters, orderBy } = options || {};
      
      let query = supabase.from(tableName).select(columns);
      
      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as unknown as T[];
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
      
      return data as unknown as T;
    } catch (error) {
      return handleError(error, `Não foi possível carregar o item de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError]);

  // Criar um novo registro
  const create = useCallback(async (data: Omit<T, 'id'>, options?: { successMessage?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { successMessage = "Item criado com sucesso" } = options || {};
      
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: successMessage
      });
      
      return result as unknown as T;
    } catch (error) {
      return handleError(error, `Não foi possível criar o item em ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toast]);

  // Atualizar um registro existente
  const update = useCallback(async (
    id: string, 
    data: Partial<T>, 
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
      
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: successMessage
      });
      
      return result as unknown as T;
    } catch (error) {
      return handleError(error, `Não foi possível atualizar o item em ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toast]);

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
      
      toast({
        title: "Sucesso",
        description: successMessage
      });
      
      return true;
    } catch (error) {
      return handleError(error, `Não foi possível excluir o item de ${tableName}`);
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError, toast]);

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
