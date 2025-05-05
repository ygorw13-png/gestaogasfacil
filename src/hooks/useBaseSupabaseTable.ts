
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { PostgrestError } from "@supabase/supabase-js";
import { ValidTableName } from "@/services/supabaseService";

// Hook genérico e reutilizável para operações CRUD em tabelas do Supabase
export function useBaseSupabaseTable<T extends Record<string, any>>(
  tableName: ValidTableName,
  options: {
    idField?: string;
    defaultErrorMessage?: string;
    defaultSuccessMessage?: string;
    showToasts?: boolean;
  } = {}
) {
  const {
    idField = 'id',
    defaultErrorMessage = "Ocorreu um erro na operação",
    defaultSuccessMessage = "Operação realizada com sucesso",
    showToasts = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | PostgrestError | null>(null);
  const { toast } = useToast();

  // Função para exibir mensagens de erro padronizadas
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const message = customMessage || defaultErrorMessage;
    console.error("Erro na operação:", error);
    
    const typedError = error instanceof Error 
      ? error 
      : new Error(String(error));
    
    setError(typedError);
    
    if (showToasts) {
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
    }
    
    return typedError;
  }, [defaultErrorMessage, showToasts, toast]);

  // Função para exibir mensagens de sucesso padronizadas
  const handleSuccess = useCallback((message?: string) => {
    if (showToasts && message) {
      toast({
        title: "Sucesso",
        description: message
      });
    }
  }, [showToasts, toast]);

  // Buscar dados da tabela
  const fetchData = useCallback(async (
    options: {
      columns?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
    } = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { columns = '*', filters, orderBy } = options;
      
      let query = supabase.from(tableName).select(columns);
      
      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
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
      
      const typedData = data as unknown as T[];
      setData(typedData);
      return typedData;
    } catch (error) {
      handleError(error, `Erro ao carregar dados de ${tableName}`);
      return [] as T[];
    } finally {
      setLoading(false);
    }
  }, [tableName, handleError]);

  // Buscar um item pelo ID
  const getById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .maybeSingle();
      
      if (error) throw error;
      
      return data as unknown as T | null;
    } catch (error) {
      handleError(error, `Erro ao buscar item de ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError]);

  // Adicionar um novo item
  const addItem = useCallback(async (
    item: Omit<T, typeof idField>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { successMessage = `Item adicionado com sucesso`, returnItem = true } = options;
      
      const query = supabase.from(tableName).insert(item);
      
      const { data, error } = returnItem
        ? await query.select().single()
        : await query;
      
      if (error) throw error;
      
      // Atualizar dados em cache se tiver sido retornado
      if (returnItem && data) {
        const newItem = data as unknown as T;
        setData(prev => [...prev, newItem]);
        handleSuccess(successMessage);
        return newItem;
      } else {
        // Se não retornou o item, recarregar dados
        await fetchData();
        handleSuccess(successMessage);
        return null;
      }
    } catch (error) {
      handleError(error, `Erro ao adicionar item em ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, fetchData, handleError, handleSuccess]);

  // Atualizar um item existente
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<T>,
    options: {
      successMessage?: string;
      returnItem?: boolean;
    } = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { successMessage = `Item atualizado com sucesso`, returnItem = true } = options;
      
      const query = supabase
        .from(tableName)
        .update(updates)
        .eq(idField, id);
      
      const { data, error } = returnItem
        ? await query.select().single()
        : await query;
      
      if (error) throw error;
      
      // Atualizar dados em cache se tiver sido retornado
      if (returnItem && data) {
        const updatedItem = data as unknown as T;
        setData(prev => prev.map(item => 
          item[idField as keyof T] === id ? updatedItem : item
        ));
        handleSuccess(successMessage);
        return updatedItem;
      } else {
        // Se não retornou o item, recarregar dados
        await fetchData();
        handleSuccess(successMessage);
        return null;
      }
    } catch (error) {
      handleError(error, `Erro ao atualizar item em ${tableName}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, fetchData, handleError, handleSuccess]);

  // Excluir um item
  const deleteItem = useCallback(async (
    id: string,
    options: {
      successMessage?: string;
    } = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { successMessage = `Item excluído com sucesso` } = options;
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      
      // Atualizar dados em cache
      setData(prev => prev.filter(item => item[idField as keyof T] !== id));
      
      handleSuccess(successMessage);
      return true;
    } catch (error) {
      handleError(error, `Erro ao excluir item de ${tableName}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tableName, idField, handleError, handleSuccess]);

  // Carregar dados na montagem do componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    getById,
    addItem,
    updateItem,
    deleteItem,
    refresh: fetchData
  };
}
