
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from "../client";
import { Database } from '../types';

// Get valid table names from the Database type
type TableNames = keyof Database['public']['Tables'];

// Generic type for custom table operations
export interface CustomTable<T> {
  select: () => Promise<PostgrestResponse<T[]>>;
  insert: (data: Omit<T, 'id'>) => Promise<PostgrestResponse<T[]>>;
  update: (data: Partial<T> & { id: string }) => Promise<PostgrestResponse<T[]>>;
  delete: (id: string) => Promise<PostgrestResponse<T[]>>;
}

/**
 * Creates a set of CRUD operations for a Supabase table
 * @param tableName The name of the table in Supabase
 * @returns An object with select, insert, update and delete methods
 */
export function createTableOperations<T extends Record<string, any>>(
  tableName: TableNames
): CustomTable<T> {
  return {
    select: async () => {
      return await supabase
        .from(tableName)
        .select('*')
        .returns<T[]>();
    },
    
    insert: async (data: Omit<T, 'id'>) => {
      return await supabase
        .from(tableName)
        .insert(data)
        .returns<T[]>();
    },
    
    update: async (data: Partial<T> & { id: string }) => {
      const { id, ...updateData } = data;
      
      return await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .returns<T[]>();
    },
    
    delete: async (id: string) => {
      return await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .returns<T[]>();
    },
  };
}

// Utility function to clear test data
export const clearTestData = async (): Promise<void> => {
  await supabase.rpc('clear_test_data');
};
