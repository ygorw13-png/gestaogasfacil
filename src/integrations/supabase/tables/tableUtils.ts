
import { PostgrestResponse } from '@supabase/supabase-js';
import { supabase } from "../client";

// Generic type for custom table operations
export interface CustomTable<T, InsertType = Omit<T, 'id'>, UpdateType = Partial<T> & { id: string }> {
  select: () => Promise<PostgrestResponse<T[]>>;
  insert: (data: InsertType) => Promise<PostgrestResponse<T[]>>;
  update: (data: UpdateType) => Promise<PostgrestResponse<T[]>>;
  delete: (id: string) => Promise<PostgrestResponse<T[]>>;
}

// Utility function to clear test data
export const clearTestData = async (): Promise<void> => {
  await supabase.rpc('clear_test_data');
};
