
import { ValidTableName } from "@/services/supabase/types";

// Options for operations that modify data
export interface SupabaseOperationOptions {
  successMessage?: string;
  idField?: string;
}

// Use proper type definitions for QueryOptions instead of importing
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

// Return type for the CRUD hook
export interface SupabaseCRUDReturn<T> {
  loading: boolean;
  error: Error | null;
  getAll: (options?: QueryOptions) => Promise<T[]>;
  getById: (id: string, options?: { columns?: string; idField?: string }) => Promise<T | null>;
  create: (data: Record<string, unknown>, options?: SupabaseOperationOptions) => Promise<T | null>;
  update: (id: string, data: Record<string, unknown>, options?: SupabaseOperationOptions) => Promise<T | null>;
  remove: (id: string, options?: SupabaseOperationOptions) => Promise<boolean>;
  resetError: () => void;
}
