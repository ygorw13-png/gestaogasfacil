
import { ValidTableName } from "@/services/supabase/types";
import { QueryOptions } from "@/services/supabase/utils/queryBuilder";

// Options for operations that modify data
export interface SupabaseOperationOptions {
  successMessage?: string;
  idField?: string;
}

// Reuse the QueryOptions from our shared utility
export { QueryOptions as SupabaseCRUDOptions };

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
