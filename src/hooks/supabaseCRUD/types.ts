
import { ValidTableName } from "@/services/supabase/types";

// Options for operations that modify data
export interface SupabaseOperationOptions {
  successMessage?: string;
  idField?: string;
}

// Options for fetching data
export interface SupabaseCRUDOptions {
  columns?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
}

// Return type for the CRUD hook
export interface SupabaseCRUDReturn<T extends Record<string, any>> {
  loading: boolean;
  error: Error | null;
  getAll: (options?: SupabaseCRUDOptions) => Promise<T[]>;
  getById: (id: string, options?: { columns?: string; idField?: string }) => Promise<T | null>;
  create: (data: any, options?: SupabaseOperationOptions) => Promise<T | null>;
  update: (id: string, data: any, options?: SupabaseOperationOptions) => Promise<T | null>;
  remove: (id: string, options?: SupabaseOperationOptions) => Promise<boolean>;
  resetError: () => void;
}
