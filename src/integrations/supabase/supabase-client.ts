
import { supabase } from "./client";
import { PostgrestError } from "@supabase/supabase-js";

// Interface padrão para respostas do Supabase
export interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

// Funções utilitárias reutilizáveis para operações Supabase
export const supabaseUtils = {
  // Tratamento de erros padronizado
  handleError: (error: unknown, context: string): Error => {
    console.error(`Erro em ${context}:`, error);
    return error instanceof PostgrestError ? error : new Error(String(error));
  },

  // Tratamento padronizado de respostas em caso de erro
  createErrorResponse: <T>(error: unknown, context: string): SupabaseResponse<T> => {
    return {
      data: null,
      error: supabaseUtils.handleError(error, context)
    };
  },

  // Operações genéricas de tabela
  table: {
    // Selecionar com tratamento de erros padronizado
    select: async <T>(
      tableName: string, 
      options: {
        columns?: string;
        filters?: Record<string, any>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        single?: boolean;
      } = {}
    ): Promise<SupabaseResponse<T>> => {
      try {
        const { columns = '*', filters, orderBy, limit, single } = options;
        
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
        
        // Aplicar limite
        if (limit) {
          query = query.limit(limit);
        }
        
        // Executar query
        const { data, error } = single 
          ? await query.single()
          : await query;
        
        return { data: data as T, error };
      } catch (error) {
        return supabaseUtils.createErrorResponse(error, `select from ${tableName}`);
      }
    },
    
    // Inserir com tratamento de erros padronizado
    insert: async <T>(
      tableName: string, 
      data: Partial<T>,
      returnData: boolean = true
    ): Promise<SupabaseResponse<T>> => {
      try {
        const query = supabase.from(tableName).insert(data);
        
        const { data: responseData, error } = returnData
          ? await query.select().single()
          : await query;
        
        return { data: responseData as T, error };
      } catch (error) {
        return supabaseUtils.createErrorResponse(error, `insert into ${tableName}`);
      }
    },
    
    // Atualizar com tratamento de erros padronizado
    update: async <T>(
      tableName: string, 
      id: string | number,
      data: Partial<T>,
      options: {
        idColumn?: string;
        returnData?: boolean;
      } = {}
    ): Promise<SupabaseResponse<T>> => {
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
        return supabaseUtils.createErrorResponse(error, `update in ${tableName}`);
      }
    },
    
    // Excluir com tratamento de erros padronizado
    delete: async (
      tableName: string, 
      id: string | number,
      idColumn: string = 'id'
    ): Promise<SupabaseResponse<null>> => {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(idColumn, id);
        
        return { data: null, error };
      } catch (error) {
        return supabaseUtils.createErrorResponse(error, `delete from ${tableName}`);
      }
    }
  },
  
  // Interface simplificada para dados de tempo real
  realtime: {
    subscribe: (
      tableName: string,
      callback: (payload: { 
        new: Record<string, any>; 
        old: Record<string, any>; 
        eventType: string;
      }) => void,
      options: {
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        filter?: string;
      } = {}
    ): (() => void) => {
      const { event = '*', filter } = options;
      
      const channel = supabase
        .channel(`public-${tableName}-changes`)
        .on(
          'postgres_changes' as any,
          {
            event,
            schema: 'public',
            table: tableName,
            filter
          },
          (payload) => callback(payload as any)
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }
};
