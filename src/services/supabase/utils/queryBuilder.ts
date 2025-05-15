
import { PostgrestFilterBuilder } from "@supabase/supabase-js";

export interface QueryFilters {
  [key: string]: any;
}

export interface QueryOrderBy {
  column: string;
  ascending?: boolean;
}

export interface QueryPagination {
  page: number;
  pageSize: number;
}

export interface QueryOptions {
  columns?: string;
  filters?: QueryFilters;
  orderBy?: QueryOrderBy;
  pagination?: QueryPagination;
}

/**
 * Builds a Supabase query with common operations like filtering, ordering, and pagination
 * This eliminates duplicate query building code across different hooks
 */
export function buildQuery<T>(
  baseQuery: PostgrestFilterBuilder<any, any, any>,
  options: QueryOptions = {}
): PostgrestFilterBuilder<any, any, any> {
  const { filters, orderBy, pagination, columns } = options;
  let query = baseQuery;
  
  // Select specific columns if provided
  if (columns) {
    // Already handled by the initial select call
  }
  
  // Apply filters if provided
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
  }
  
  // Apply ordering if provided
  if (orderBy) {
    query = query.order(orderBy.column, { 
      ascending: orderBy.ascending ?? true 
    });
  }
  
  // Apply pagination if provided
  if (pagination) {
    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }
  
  return query;
}
