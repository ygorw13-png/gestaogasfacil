
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
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

// Standard error response creator
function createErrorResponse<T>(error: unknown, context: string): ApiResponse<T> {
  console.error(`Error in ${context}:`, error);
  return {
    error: error instanceof PostgrestError ? error : new Error(String(error)),
    status: 'error',
    message: error instanceof Error ? error.message : String(error)
  };
}

// Standard success response creator
function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 'success'
  };
}

// Apply filters to a query
function applyFilters(query: any, filters?: Record<string, any>) {
  if (!filters) return query;

  Object.entries(filters).forEach(([key, value]) => {
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

  return query;
}

// Apply sorting to a query
function applySorting(query: any, orderBy?: { column: string; ascending?: boolean }) {
  if (!orderBy) return query;
  
  return query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
}

// Apply pagination to a query
function applyPagination(query: any, pagination?: { page: number; pageSize: number }) {
  if (!pagination) return query;
  
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

// Generic fetch function with error handling
export async function fetchData<TData extends Record<string, any>>(
  table: ValidTableName,
  queryOptions?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    pagination?: { page: number; pageSize: number };
    relations?: string[];
  }
): Promise<ApiResponse<TData[]>> {
  try {
    let query = supabase.from(table).select(queryOptions?.columns || '*');

    // Apply query modifiers
    query = applyFilters(query, queryOptions?.filters);
    query = applySorting(query, queryOptions?.orderBy);
    query = applyPagination(query, queryOptions?.pagination);

    const { data, error } = await query;

    if (error) throw error;

    return createSuccessResponse(data as unknown as TData[]);
  } catch (error) {
    return createErrorResponse<TData[]>(error, `fetchData from ${table}`);
  }
}

// Generic insert function with error handling
export async function insertData<TData extends Record<string, any>>(
  table: ValidTableName,
  data: Partial<TData>
): Promise<ApiResponse<TData>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(result as unknown as TData);
  } catch (error) {
    return createErrorResponse<TData>(error, `insertData into ${table}`);
  }
}

// Generic update function with error handling
export async function updateData<TData extends Record<string, any>>(
  table: ValidTableName,
  id: string,
  data: Partial<TData>,
  idColumn: string = 'id'
): Promise<ApiResponse<TData>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq(idColumn, id)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(result as unknown as TData);
  } catch (error) {
    return createErrorResponse<TData>(error, `updateData in ${table}`);
  }
}

// Generic delete function with error handling
export async function deleteData(
  table: ValidTableName,
  id: string,
  idColumn: string = 'id'
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumn, id);

    if (error) throw error;

    return createSuccessResponse(null);
  } catch (error) {
    return createErrorResponse<null>(error, `deleteData from ${table}`);
  }
}

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
        return data as unknown as TData[];
      },
      enabled: options?.enabled !== false,
      errorMessage: `Erro ao carregar dados de ${tableName}`
    });
  };

  // Add an item to a table
  const useAddItem = (options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: PostgrestError | Error) => void;
    successMessage?: string;
  }) => {
    // Fix the type error by using a specific function type
    type AddFunctionType = (newData: Partial<TData>) => Promise<TData>;
    
    const addFunction: AddFunctionType = async (newData) => {
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
    onError?: (error: PostgrestError | Error) => void;
    successMessage?: string;
    idField?: string;
  }) => {
    const idField = options?.idField || 'id';
    
    // Fix the type error by using a specific function type
    type UpdateFunctionType = (params: { id: string; data: Partial<TData> }) => Promise<TData>;
    
    const updateFunction: UpdateFunctionType = async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
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
    onError?: (error: PostgrestError | Error) => void;
    successMessage?: string;
    idField?: string;
  }) => {
    const idField = options?.idField || 'id';
    
    // Fix the type error by using a specific function type
    type DeleteFunctionType = (id: string) => Promise<null>;
    
    const deleteFunction: DeleteFunctionType = async (id) => {
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
