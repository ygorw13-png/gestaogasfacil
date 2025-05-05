
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

// Fixed update function - removed complex generic type handling
export async function updateData<T = any>(
  table: ValidTableName,
  id: string,
  data: Record<string, any>,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    // First, perform the update operation
    const { error: updateError } = await supabase
      .from(table)
      .update(data)
      .eq(idColumn, id);
    
    if (updateError) throw updateError;
    
    // Then, fetch the updated record in a separate query
    const { data: result, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    if (!result) {
      throw new Error(`Record not found after update: ${idColumn}=${id}`);
    }
    
    // Simple type cast without complex type inference
    return createSuccessResponse<T>(result as unknown as T);
  } catch (error) {
    return createErrorResponse<T>(error, `updateData in ${table}`);
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
