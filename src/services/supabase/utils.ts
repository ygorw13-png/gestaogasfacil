
import { ApiResponse } from "./types";
import { PostgrestError } from "@supabase/supabase-js";

// Standard error response creator
export function createErrorResponse<T>(error: unknown, context: string): ApiResponse<T> {
  console.error(`Error in ${context}:`, error);
  return {
    error: error instanceof PostgrestError ? error : new Error(String(error)),
    status: 'error',
    message: error instanceof Error ? error.message : String(error)
  };
}

// Standard success response creator
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    status: 'success'
  };
}

// Apply filters to a query
export function applyFilters(query: any, filters?: Record<string, any>) {
  if (!filters) return query;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // Handle range filters and other complex types
        if ('gt' in value) query = query.gt(key, value.gt);
        if ('gte' in value) query = query.gte(key, value.gte);
        if ('lt' in value) query = query.lt(key, value.lt);
        if ('lte' in value) query = query.lte(key, value.lte);
        if ('like' in value) query = query.like(key, `%${value.like}%`);
      } else {
        query = query.eq(key, value);
      }
    }
  });

  return query;
}

// Apply sorting to a query
export function applySorting(query: any, orderBy?: { column: string; ascending?: boolean }) {
  if (!orderBy) return query;
  
  return query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
}

// Apply pagination to a query
export function applyPagination(query: any, pagination?: { page: number; pageSize: number }) {
  if (!pagination) return query;
  
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}
