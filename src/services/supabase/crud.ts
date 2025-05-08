
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
    // Break the type recursion by using a more basic type annotation
    const result = await supabase
      .from(table)
      .insert(data as any)
      .select()
      .single();
    
    if (result.error) throw result.error;

    return createSuccessResponse(result.data as Record<string, any>);
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
    // First, perform the update operation without type recursion
    const updateResult = await supabase
      .from(table)
      .update(data as any)
      .eq(idColumn, id);
    
    if (updateResult.error) throw updateResult.error;
    
    // Then, fetch the updated record in a separate query
    const fetchResult = await supabase
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle();
    
    if (fetchResult.error) throw fetchResult.error;
    
    if (!fetchResult.data) {
      throw new Error(`Record not found after update: ${idColumn}=${id}`);
    }
    
    return createSuccessResponse(fetchResult.data as Record<string, any>);
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
