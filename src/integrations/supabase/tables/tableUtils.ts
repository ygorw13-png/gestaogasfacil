
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from "../client";
import { Database } from '../types';

// Obter nomes de tabelas válidos a partir do tipo Database
type TableNames = keyof Database['public']['Tables'];

// Tipo genérico para operações de tabela personalizadas
export interface CustomTable<T> {
  select: () => Promise<PostgrestResponse<T>>;
  getById?: (id: string) => Promise<PostgrestResponse<T>>;
  insert: (data: Omit<T, 'id'>) => Promise<PostgrestResponse<T>>;
  update: (data: Partial<T> & { id: string }) => Promise<PostgrestResponse<T>>;
  delete: (id: string) => Promise<PostgrestResponse<T>>;
}

/**
 * Cria um conjunto de operações CRUD para uma tabela do Supabase
 * @param tableName O nome da tabela no Supabase
 * @returns Um objeto com métodos select, insert, update e delete
 */
export function createTableOperations<T extends Record<string, any>>(
  tableName: TableNames
): CustomTable<T> {
  return {
    select: async () => {
      try {
        return await supabase
          .from(tableName)
          .select('*') as PostgrestResponse<T>;
      } catch (error) {
        console.error(`Erro ao selecionar de ${tableName}:`, error);
        throw error;
      }
    },
    
    getById: async (id: string) => {
      try {
        return await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle() as PostgrestResponse<T>;
      } catch (error) {
        console.error(`Erro ao buscar ${id} de ${tableName}:`, error);
        throw error;
      }
    },
    
    insert: async (data: Omit<T, 'id'>) => {
      try {
        return await supabase
          .from(tableName)
          .insert(data as any)
          .select()
          .single() as PostgrestResponse<T>;
      } catch (error) {
        console.error(`Erro ao inserir em ${tableName}:`, error);
        throw error;
      }
    },
    
    update: async (data: Partial<T> & { id: string }) => {
      try {
        const { id, ...updateData } = data;
        
        return await supabase
          .from(tableName)
          .update(updateData as any)
          .eq('id', id)
          .select()
          .single() as PostgrestResponse<T>;
      } catch (error) {
        console.error(`Erro ao atualizar em ${tableName}:`, error);
        throw error;
      }
    },
    
    delete: async (id: string) => {
      try {
        return await supabase
          .from(tableName)
          .delete()
          .eq('id', id) as PostgrestResponse<T>;
      } catch (error) {
        console.error(`Erro ao excluir de ${tableName}:`, error);
        throw error;
      }
    },
  };
}

// Função utilitária para limpar dados de teste
export const clearTestData = async (): Promise<void> => {
  await supabase.rpc('clear_test_data');
};
