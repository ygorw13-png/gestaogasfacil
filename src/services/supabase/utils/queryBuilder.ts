
import { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export interface QueryOptions {
  columns?: string;
  filters?: QueryFilters[];
  orderBy?: QueryOrderBy;
  limit?: number;
  foreignTable?: string;
  idField?: string;
}

export interface QueryFilters {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
  value: any;
}

export interface QueryOrderBy {
  column: string;
  ascending?: boolean;
}

/**
 * Applies query options to a Supabase query
 * Extracts this logic to a utility function for reuse
 */
export function applyQueryOptions<T>(
  query: PostgrestFilterBuilder<any, any, T[]>,
  options?: QueryOptions
): PostgrestFilterBuilder<any, any, T[]> {
  let modifiedQuery = query;

  if (!options) return modifiedQuery;

  // Apply filters if provided
  if (options.filters && options.filters.length > 0) {
    options.filters.forEach(filter => {
      switch (filter.operator) {
        case "eq":
          modifiedQuery = modifiedQuery.eq(filter.field, filter.value);
          break;
        case "neq":
          modifiedQuery = modifiedQuery.neq(filter.field, filter.value);
          break;
        case "gt":
          modifiedQuery = modifiedQuery.gt(filter.field, filter.value);
          break;
        case "gte":
          modifiedQuery = modifiedQuery.gte(filter.field, filter.value);
          break;
        case "lt":
          modifiedQuery = modifiedQuery.lt(filter.field, filter.value);
          break;
        case "lte":
          modifiedQuery = modifiedQuery.lte(filter.field, filter.value);
          break;
        case "like":
          modifiedQuery = modifiedQuery.like(filter.field, filter.value);
          break;
        case "ilike":
          modifiedQuery = modifiedQuery.ilike(filter.field, filter.value);
          break;
        case "in":
          modifiedQuery = modifiedQuery.in(filter.field, filter.value);
          break;
        case "is":
          modifiedQuery = modifiedQuery.is(filter.field, filter.value);
          break;
        default:
          break;
      }
    });
  }

  // Apply ordering if provided
  if (options.orderBy) {
    modifiedQuery = modifiedQuery.order(
      options.orderBy.column, 
      { ascending: options.orderBy.ascending !== false }
    );
  }

  // Apply limit if provided
  if (options.limit) {
    modifiedQuery = modifiedQuery.limit(options.limit);
  }

  return modifiedQuery;
}

// Add explicit buildQuery function to resolve import error
export function buildQuery<T>(
  baseQuery: PostgrestFilterBuilder<any, any, T[]>,
  options?: QueryOptions
): PostgrestFilterBuilder<any, any, T[]> {
  return applyQueryOptions(baseQuery, options);
}
