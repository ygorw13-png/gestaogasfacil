
import { supabase } from "@/integrations/supabase/client";
import { ValidTableName } from "@/services/supabase/types";
import { Database } from "@/integrations/supabase/types";

// Cast the string table name to a type-safe table name
type TableNames = keyof Database['public']['Tables'];

/**
 * Fetches data from a specified table with optional filtering, ordering, and pagination
 */
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
    // Cast tableName to table name type for type safety
    const table = tableName as TableNames;
    
    // Start building the query - use any to avoid deep type instantiation
    let query: any = supabase.from(table).select(options?.columns || '*');

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

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return { data: null, error };
    }

    // Return the data with a basic type assertion
    return { data: data as T[], error: null };
  } catch (error) {
    console.error(`Error in fetchData for ${tableName}:`, error);
    return { 
      data: null, 
      error: { message: `Failed to fetch data from ${tableName}` } 
    };
  }
}

/**
 * Updates a record in the specified table
 */
export async function updateData(tableName: ValidTableName, id: string, data: Record<string, any>) {
  try {
    // Cast tableName to table name type for type safety
    const table = tableName as TableNames;
    
    // Execute update operation with explicit any typing
    const { error } = await supabase
      .from(table)
      .update(data as any)
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

/**
 * Inserts a new record into the specified table
 */
export async function insertData(tableName: ValidTableName, data: Record<string, any>) {
  try {
    // Cast tableName to table name type for type safety
    const table = tableName as TableNames;
    
    // Execute insert operation with explicit any typing
    const { error } = await supabase
      .from(table)
      .insert(data as any);
    
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

/**
 * Deletes a record from the specified table
 */
export async function deleteData(tableName: ValidTableName, id: string) {
  try {
    // Cast tableName to table name type for type safety
    const table = tableName as TableNames;
    
    // Execute delete operation
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
