
import { ApiResponse } from "./types";

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    status: 'success',
    data,
    error: null
  };
}

export function createErrorResponse(error: unknown, message?: string): ApiResponse<null> {
  const errorMessage = message || (error instanceof Error ? error.message : String(error));
  console.error(errorMessage, error);
  
  return {
    status: 'error',
    data: null,
    error: {
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }
  };
}

// Apply filters to a Supabase query
export function applyFilters(query: any, filters?: Record<string, any>) {
  if (!filters) return query;
  
  let modifiedQuery = query;
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      modifiedQuery = modifiedQuery.eq(key, value);
    }
  });
  
  return modifiedQuery;
}

// Apply sorting to a Supabase query
export function applySorting(query: any, orderBy?: { column: string; ascending?: boolean }) {
  if (!orderBy) return query;
  
  return query.order(orderBy.column, { 
    ascending: orderBy.ascending ?? true 
  });
}

// Apply pagination to a Supabase query
export function applyPagination(query: any, pagination?: { page: number; pageSize: number }) {
  if (!pagination) return query;
  
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return query.range(from, to);
}
