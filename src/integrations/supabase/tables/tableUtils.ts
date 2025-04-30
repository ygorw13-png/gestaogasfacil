
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from "../client";

// Generic type for custom table operations
export interface CustomTable<T, InsertType = Omit<T, 'id'>, UpdateType = Partial<T> & { id: string }> {
  select: () => Promise<PostgrestResponse<T[]>>;
  insert: (data: InsertType) => Promise<PostgrestResponse<T[]>>;
  update: (data: UpdateType) => Promise<PostgrestResponse<T[]>>;
  delete: (id: string) => Promise<PostgrestResponse<T[]>>;
}

/**
 * Creates a set of CRUD operations for a Supabase table
 * @param tableName The name of the table in Supabase
 * @returns An object with select, insert, update and delete methods
 */
export function createTableOperations<T extends Record<string, any>>(
  tableName: string
): CustomTable<T> {
  return {
    select: async () => {
      const response = await supabase
        .from(tableName)
        .select('*') as PostgrestResponse<T[]>;
      return response;
    },
    
    insert: async (data: Omit<T, 'id'>) => {
      const response = await supabase
        .from(tableName)
        .insert(data) as PostgrestResponse<T[]>;
      return response;
    },
    
    update: async (data: Partial<T> & { id: string }) => {
      const { id, ...updateData } = data;
      
      const response = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id) as PostgrestResponse<T[]>;
      return response;
    },
    
    delete: async (id: string) => {
      const response = await supabase
        .from(tableName)
        .delete()
        .eq('id', id) as PostgrestResponse<T[]>;
      return response;
    },
  };
}

// Utility function to clear test data
export const clearTestData = async (): Promise<void> => {
  await supabase.rpc('clear_test_data');
};
