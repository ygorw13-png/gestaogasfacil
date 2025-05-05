
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseMutation } from "@/hooks/useSupabaseMutation";
import { ValidTableName } from "./types";

// Factory for creating table-specific hooks
export function useSupabaseTable<TData extends Record<string, any>>(tableName: ValidTableName) {
  // Get data from a table with filtering options
  const useTableData = (options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    enabled?: boolean;
    queryKey?: string[];
  }) => {
    const queryKey = options?.queryKey || [tableName];
    
    return useSupabaseQuery<TData[]>({
      queryKey,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select(options?.columns || '*');
        
        if (error) throw error;
        // Explicit casting to avoid type inference issues
        return data as unknown as TData[];
      },
      enabled: options?.enabled !== false,
      errorMessage: `Erro ao carregar dados de ${tableName}`
    });
  };

  // Add an item to a table
  const useAddItem = (options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: any) => void;
    successMessage?: string;
  }) => {
    const addFunction = async (newData: Partial<TData>) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newData)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as TData;
    };
    
    return useSupabaseMutation<TData, Partial<TData>>({
      mutationFn: addFunction,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      successMessage: options?.successMessage || `Item adicionado com sucesso`
    });
  };

  // Update an item in a table
  const useUpdateItem = (options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: any) => void;
    successMessage?: string;
    idField?: string;
  }) => {
    const idField = options?.idField || 'id';
    
    const updateFunction = async (params: { id: string; data: Partial<TData> }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(params.data)
        .eq(idField, params.id)
        .select()
        .single();
      
      if (error) throw error;
      return result as unknown as TData;
    };
    
    return useSupabaseMutation<TData, { id: string; data: Partial<TData> }>({
      mutationFn: updateFunction,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      successMessage: options?.successMessage || `Item atualizado com sucesso`
    });
  };

  // Delete an item from a table
  const useDeleteItem = (options?: {
    onSuccess?: () => void;
    onError?: (error: any) => void;
    successMessage?: string;
    idField?: string;
  }) => {
    const idField = options?.idField || 'id';
    
    const deleteFunction = async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, id);
      
      if (error) throw error;
      return null;
    };
    
    return useSupabaseMutation<null, string>({
      mutationFn: deleteFunction,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      successMessage: options?.successMessage || `Item excluído com sucesso`
    });
  };

  return {
    useTableData,
    useAddItem,
    useUpdateItem,
    useDeleteItem
  };
}
