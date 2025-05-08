
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse, ValidTableName, QueryOptions } from "./types";
import { createErrorResponse, createSuccessResponse, applyFilters, applySorting, applyPagination } from "./utils";

// Generic fetch function with error handling
export async function fetchData(
  table: ValidTableName,
  queryOptions?: QueryOptions
): Promise<ApiResponse<Record<string, any>[]>> {
  try {
    // Start with a basic query
    let query = supabase.from(table).select(queryOptions?.columns || '*');

    // Apply query modifiers
    query = applyFilters(query, queryOptions?.filters);
    query = applySorting(query, queryOptions?.orderBy);
    query = applyPagination(query, queryOptions?.pagination);

    const { data, error } = await query;

    if (error) throw error;

    return createSuccessResponse(data || []);
  } catch (error) {
    return createErrorResponse(error, `fetchData from ${table}`);
  }
}

// Generic insert function with error handling
export async function insertData(
  table: ValidTableName,
  data: Record<string, any>
): Promise<ApiResponse<Record<string, any>>> {
  try {
    // Use type assertion to bypass TypeScript's strict checking
    const { data: result, error } = await supabase
      .from(table)
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error, `insertData into ${table}`);
  }
}

// Simplified update function
export async function updateData(
  table: ValidTableName,
  id: string,
  data: Record<string, any>,
  idColumn: string = 'id'
): Promise<ApiResponse<Record<string, any>>> {
  try {
    // First, perform the update operation
    const { error: updateError } = await supabase
      .from(table)
      .update(data as any)
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
    
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error, `updateData in ${table}`);
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
    return createErrorResponse(error, `deleteData from ${table}`);
  }
}
