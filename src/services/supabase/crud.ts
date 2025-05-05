
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

// Generic update function with error handling - completely rewritten to avoid type inference issues
export async function updateData<TData extends Record<string, any>>(
  table: ValidTableName,
  id: string,
  data: Partial<TData>,
  idColumn: string = 'id'
): Promise<ApiResponse<TData>> {
  try {
    // Use a two-step approach to avoid complex type inference issues
    
    // Step 1: Perform the update without returning data
    const updateOperation = await supabase
      .from(table)
      .update(data)
      .eq(idColumn, id);
      
    if (updateOperation.error) throw updateOperation.error;
    
    // Step 2: Fetch the updated record separately
    const fetchOperation = await supabase
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle();
    
    if (fetchOperation.error) throw fetchOperation.error;
    if (!fetchOperation.data) {
      throw new Error(`Record not found after update: ${idColumn}=${id}`);
    }
    
    // Safely cast the result to the expected type
    return createSuccessResponse(fetchOperation.data as unknown as TData);
  } catch (error) {
    return createErrorResponse<TData>(error, `updateData in ${table}`);
  }
}

// Generic delete function with error handling
export async function deleteData(
  table: ValidTableName,
  id: string,
  idColumn: string = 'id'
): Promise<ApiResponse<null>> {
  try {
    const deleteOperation = await supabase
      .from(table)
      .delete()
      .eq(idColumn, id);

    if (deleteOperation.error) throw deleteOperation.error;

    return createSuccessResponse(null);
  } catch (error) {
    return createErrorResponse<null>(error, `deleteData from ${table}`);
  }
}
