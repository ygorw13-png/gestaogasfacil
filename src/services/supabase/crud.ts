
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

// Generic update function with error handling
export async function updateData<TData extends Record<string, any>>(
  table: ValidTableName,
  id: string,
  data: Partial<TData>,
  idColumn: string = 'id'
): Promise<ApiResponse<TData>> {
  try {
    // Create the query without chaining to avoid deep type inference
    const baseQuery = supabase.from(table);
    const updateQuery = baseQuery.update(data);
    const filteredQuery = updateQuery.eq(idColumn, id);
    const selectQuery = filteredQuery.select();
    
    // Execute the query separately
    const { data: result, error } = await selectQuery.single();

    if (error) throw error;

    // Explicitly cast the result to the expected type
    return createSuccessResponse(result as unknown as TData);
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
    // Create the query without chaining to avoid deep type inference
    const baseQuery = supabase.from(table);
    const deleteQuery = baseQuery.delete();
    const filteredQuery = deleteQuery.eq(idColumn, id);
    
    // Execute the query
    const { error } = await filteredQuery;

    if (error) throw error;

    return createSuccessResponse(null);
  } catch (error) {
    return createErrorResponse<null>(error, `deleteData from ${table}`);
  }
}
