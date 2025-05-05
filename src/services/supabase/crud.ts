
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse, ValidTableName, QueryOptions } from "./types";
import { createErrorResponse, createSuccessResponse, applyFilters, applySorting, applyPagination } from "./utils";

// Generic fetch function with error handling
export async function fetchData<TData extends Record<string, any>>(
  table: ValidTableName,
  queryOptions?: QueryOptions
): Promise<ApiResponse<TData[]>> {
  try {
    // Start with a basic query and use type assertion to prevent deep type inference
    let query = supabase.from(table).select(queryOptions?.columns || '*') as any;

    // Apply query modifiers
    query = applyFilters(query, queryOptions?.filters);
    query = applySorting(query, queryOptions?.orderBy);
    query = applyPagination(query, queryOptions?.pagination);

    const { data, error } = await query;

    if (error) throw error;

    // Cast the result to the expected type after the query is executed
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

    // Explicitly cast the result to the expected type
    return createSuccessResponse(result as unknown as TData);
  } catch (error) {
    return createErrorResponse<TData>(error, `insertData into ${table}`);
  }
}

// Fully refactored update function avoiding complex type inference completely
export async function updateData<TData extends Record<string, any>>(
  table: ValidTableName,
  id: string,
  data: Partial<TData>,
  idColumn: string = 'id'
): Promise<ApiResponse<TData>> {
  try {
    // Step 1: First just update the record without type inference
    const updateQuery = `UPDATE ${table} SET ${Object.keys(data).map(key => `${key} = $${key}`).join(', ')} WHERE ${idColumn} = $id RETURNING *`;
    
    // Build parameters object for the query
    const params: Record<string, any> = { ...data, id };
    
    // Execute the raw query as string to bypass TypeScript inference
    const { data: updated, error: updateError } = await supabase.rpc('execute_sql', { 
      sql_query: updateQuery,
      params: params
    });
    
    if (updateError) throw updateError;
    
    if (!updated || updated.length === 0) {
      // If no record was updated, fetch it to check if it exists
      const { data: existingData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq(idColumn, id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!existingData) {
        throw new Error(`Record not found: ${idColumn}=${id}`);
      }
      
      // Record exists but no fields were changed
      return createSuccessResponse(existingData as TData);
    }
    
    // Return the first record from the update operation
    return createSuccessResponse(updated[0] as TData);
  } catch (error) {
    // Fallback approach if the rpc method fails
    try {
      // First do the update without returning data
      const { error: updateError } = await supabase
        .from(table)
        .update(data as Record<string, any>)
        .eq(idColumn, id);
      
      if (updateError) throw updateError;
      
      // Then fetch the updated record
      const { data: fetchedData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq(idColumn, id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!fetchedData) {
        throw new Error(`Record not found after update: ${idColumn}=${id}`);
      }
      
      return createSuccessResponse(fetchedData as TData);
    } catch (fallbackError) {
      // If both approaches fail, return the original error
      return createErrorResponse<TData>(error, `updateData in ${table}`);
    }
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
