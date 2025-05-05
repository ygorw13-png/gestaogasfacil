
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

// List of valid tables in the database
export type ValidTableName = 'cascos_emprestados' | 'clients' | 'colaboradores' | 'organizations' | 
  'configuracoes_entrega' | 'configuracoes_estoque' | 'configuracoes_financeiras' | 
  'configuracoes_notificacoes' | 'configuracoes_seguranca' | 'configuracoes_sistema' | 
  'dashboard_data' | 'orders' | 'profiles' | 'requisicoes_estoque';

// Generic data fetching function
export async function fetchFromTable<T>(
  tableName: ValidTableName, 
  options: {
    columns?: string;
    where?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<SupabaseResponse<T>> {
  try {
    const { columns = '*', where, orderBy, limit, single } = options;
    
    let query = supabase.from(tableName).select(columns);
    
    // Apply filters
    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    // Execute query
    const { data, error } = single 
      ? await query.single()
      : await query;
    
    return { data: data as T, error };
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof PostgrestError ? error : new Error(String(error))
    };
  }
}

// Generalized insert function
export async function insertIntoTable<T>(
  tableName: ValidTableName, 
  data: Partial<T>,
  options: {
    returnData?: boolean;
  } = {}
): Promise<SupabaseResponse<T>> {
  try {
    const { returnData = true } = options;
    
    const query = supabase.from(tableName).insert(data);
    
    const { data: responseData, error } = returnData
      ? await query.select().single()
      : await query;
    
    return { data: responseData as T, error };
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof PostgrestError ? error : new Error(String(error))
    };
  }
}

// Generalized update function
export async function updateInTable<T>(
  tableName: ValidTableName, 
  id: string | number,
  data: Partial<T>,
  options: {
    idColumn?: string;
    returnData?: boolean;
  } = {}
): Promise<SupabaseResponse<T>> {
  try {
    const { idColumn = 'id', returnData = true } = options;
    
    const query = supabase
      .from(tableName)
      .update(data)
      .eq(idColumn, id);
    
    const { data: responseData, error } = returnData
      ? await query.select().single()
      : await query;
    
    return { data: responseData as T, error };
  } catch (error) {
    console.error(`Error updating in ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof PostgrestError ? error : new Error(String(error))
    };
  }
}

// Generalized delete function
export async function deleteFromTable(
  tableName: ValidTableName, 
  id: string | number,
  options: {
    idColumn?: string;
  } = {}
): Promise<SupabaseResponse<null>> {
  try {
    const { idColumn = 'id' } = options;
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, id);
    
    return { data: null, error };
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof PostgrestError ? error : new Error(String(error))
    };
  }
}

// Subscribe to real-time changes - with corrected type handling
export function subscribeToTable(
  tableName: ValidTableName,
  callback: (payload: any) => void,
  options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
  } = {}
): () => void {
  const { event = '*', filter } = options;
  
  const channel = supabase
    .channel(`public-${tableName}-changes`)
    .on(
      'postgres_changes' as any, // Type assertion to bypass type checking
      {
        event,
        schema: 'public',
        table: tableName,
        filter
      },
      callback
    )
    .subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
