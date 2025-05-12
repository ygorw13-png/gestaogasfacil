
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { Database } from "@/integrations/supabase/types";

// Create a type that represents all valid table names from Database type
type TableNames = keyof Database['public']['Tables'];

export async function fetchData<T = any>(
  tableName: ValidTableName,
  options?: {
    columns?: string;
    filters?: Record<string, any>;
    range?: { from: number; to: number };
    orderBy?: { column: string; ascending: boolean };
  }
) {
  try {
    // Cast tableName to TableNames to ensure type safety
    const table = tableName as TableNames;
    let query = supabase.from(table).select(options?.columns || '*');

    // Apply filters if provided
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        query = query.eq(key, value);
      }
    }

    // Apply ordering if provided
    if (options?.orderBy) {
      const { column, ascending } = options.orderBy;
      query = query.order(column, { ascending });
    }

    // Apply range if provided
    if (options?.range) {
      const { from, to } = options.range;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Error in fetchData for ${tableName}:`, error);
    return { 
      data: null, 
      error: { message: `Failed to fetch data from ${tableName}` } 
    };
  }
}

export async function updateData(tableName: ValidTableName, id: string, data: any) {
  try {
    // Cast tableName to TableNames to ensure type safety
    const table = tableName as TableNames;
    const { error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${tableName} with id ${id}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Error in updateData for ${tableName} with id ${id}:`, error);
    return { error: { message: `Failed to update data in ${tableName}` } };
  }
}

export async function insertData(tableName: ValidTableName, data: any) {
  try {
    // Cast tableName to TableNames to ensure type safety
    const table = tableName as TableNames;
    const { error } = await supabase
      .from(table)
      .insert(data);

    if (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Error in insertData for ${tableName}:`, error);
    return { error: { message: `Failed to insert data into ${tableName}` } };
  }
}

export async function deleteData(tableName: ValidTableName, id: string) {
  try {
    // Cast tableName to TableNames to ensure type safety
    const table = tableName as TableNames;
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${tableName} with id ${id}:`, error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error(`Error in deleteData for ${tableName} with id ${id}:`, error);
    return { error: { message: `Failed to delete data from ${tableName}` } };
  }
}
