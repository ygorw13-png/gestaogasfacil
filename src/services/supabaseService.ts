
import { supabase } from "@/integrations/supabase/client";
import { PostgrestResponse, PostgrestError } from "@supabase/supabase-js";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseMutation } from "@/hooks/useSupabaseMutation";

// Interface for standardized API response
export interface ApiResponse<T> {
  data?: T;
  error?: PostgrestError | Error;
  status: 'success' | 'error';
  message?: string;
}

// Valid table names
export type ValidTableName = 'cascos_emprestados' | 'clients' | 'colaboradores' | 'organizations' | 
  'configuracoes_entrega' | 'configuracoes_estoque' | 'configuracoes_financeiras' | 
  'configuracoes_notificacoes' | 'configuracoes_seguranca' | 'configuracoes_sistema' | 
  'dashboard_data' | 'orders' | 'profiles' | 'requisicoes_estoque';

// Generic fetch function with error handling
export async function fetchData<T>(
  table: ValidTableName,
  queryOptions?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    pagination?: { page: number; pageSize: number };
    relations?: string[];
  }
): Promise<ApiResponse<T[]>> {
  try {
    let query = supabase.from(table).select(queryOptions?.columns || '*');

    // Apply filters
    if (queryOptions?.filters) {
      Object.entries(queryOptions.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Handle range filters and other complex types
            if ('gt' in value) query = query.gt(key, value.gt);
            if ('gte' in value) query = query.gte(key, value.gte);
            if ('lt' in value) query = query.lt(key, value.lt);
            if ('lte' in value) query = query.lte(key, value.lte);
            if ('like' in value) query = query.like(key, `%${value.like}%`);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Apply ordering
    if (queryOptions?.orderBy) {
      const { column, ascending = true } = queryOptions.orderBy;
      query = query.order(column, { ascending });
    }

    // Apply pagination
    if (queryOptions?.pagination) {
      const { page, pageSize } = queryOptions.pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data as T[],
      status: 'success'
    };
  } catch (error) {
    console.error(`Error fetching data from ${table}:`, error);
    return {
      error: error as PostgrestError | Error,
      status: 'error',
      message: (error as Error).message
    };
  }
}

// Generic insert function with error handling
export async function insertData<T>(
  table: ValidTableName,
  data: Partial<T>
): Promise<ApiResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: result as T,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error inserting data into ${table}:`, error);
    return {
      error: error as PostgrestError | Error,
      status: 'error',
      message: (error as Error).message
    };
  }
}

// Generic update function with error handling
export async function updateData<T>(
  table: ValidTableName,
  id: string | number,
  data: Partial<T>,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq(idColumn, id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: result as T,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error updating data in ${table}:`, error);
    return {
      error: error as PostgrestError | Error,
      status: 'error',
      message: (error as Error).message
    };
  }
}

// Generic delete function with error handling
export async function deleteData(
  table: ValidTableName,
  id: string | number,
  idColumn: string = 'id'
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumn, id);

    if (error) {
      throw error;
    }

    return {
      status: 'success'
    };
  } catch (error) {
    console.error(`Error deleting data from ${table}:`, error);
    return {
      error: error as PostgrestError | Error,
      status: 'error',
      message: (error as Error).message
    };
  }
}

// Custom hooks for common Supabase operations
export function useSupabaseTable<T>(tableName: ValidTableName) {
  // Get data from a table with filtering options
  const useTableData = (options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    enabled?: boolean;
    queryKey?: string[];
  }) => {
    const queryKey = options?.queryKey || [tableName];
    
    return useSupabaseQuery<T[]>({
      queryKey,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select(options?.columns || '*');
        
        if (error) throw error;
        return data as T[];
      },
      enabled: options?.enabled !== false,
      errorMessage: `Erro ao carregar dados de ${tableName}`
    });
  };

  // Add an item to a table
  const useAddItem = (options?: {
    onSuccess?: (data: T[]) => void;
    onError?: (error: PostgrestError | Error) => void;
    successMessage?: string;
  }) => {
    return useSupabaseMutation<T, Partial<T>>({
      mutationFn: async (newData) => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(newData)
          .select()
          .single();
        
        if (error) throw error;
        return data as T;
      },
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      successMessage: options?.successMessage || `Item adicionado com sucesso`
    });
  };

  // Update an item in a table
  const useUpdateItem = (options?: {
    onSuccess?: (data: T[]) => void;
    onError?: (error: PostgrestError | Error) => void;
    successMessage?: string;
    idField?: string;
  }) => {
    const idField = options?.idField || 'id';
    
    return useSupabaseMutation<T, { id: string | number; data: Partial<T> }>({
      mutationFn: async ({ id, data }) => {
        const { data: result, error } = await supabase
          .from(tableName)
          .update(data)
          .eq(idField, id)
          .select()
          .single();
        
        if (error) throw error;
        return result as T;
      },
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      successMessage: options?.successMessage || `Item atualizado com sucesso`
    });
  };

  // Delete an item from a table
  const useDeleteItem = (options?: {
    onSuccess?: () => void;
    onError?: (error: PostgrestError | Error) => void;
    successMessage?: string;
    idField?: string;
  }) => {
    const idField = options?.idField || 'id';
    
    return useSupabaseMutation<null, string | number>({
      mutationFn: async (id) => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(idField, id);
        
        if (error) throw error;
        return null;
      },
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
