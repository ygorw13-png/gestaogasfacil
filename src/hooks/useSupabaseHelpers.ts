
import { PostgrestError } from "@supabase/supabase-js";
import { useToast } from "./use-toast";
import { useCallback } from "react";

export interface SupabaseErrorHandlerOptions {
  defaultErrorMessage?: string;
  showToasts?: boolean;
}

/**
 * Custom hook for standardized Supabase error handling
 * This eliminates duplicated error handling code across multiple hooks
 */
export function useSupabaseErrorHandler(options: SupabaseErrorHandlerOptions = {}) {
  const {
    defaultErrorMessage = "Ocorreu um erro na operação",
    showToasts = true
  } = options;
  
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const message = customMessage || defaultErrorMessage;
    console.error("Erro na operação:", error);
    
    const typedError = error instanceof Error 
      ? error 
      : new Error(String(error));
    
    if (showToasts) {
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
    }
    
    return typedError;
  }, [defaultErrorMessage, showToasts, toast]);

  const handleSuccess = useCallback((message?: string) => {
    if (showToasts && message) {
      toast({
        title: "Sucesso",
        description: message
      });
    }
  }, [showToasts, toast]);

  return {
    handleError,
    handleSuccess
  };
}

/**
 * Common Supabase query builder utilities that can be shared
 * between different hooks to reduce duplication
 */
export function buildSupabaseQuery(query: any, options: {
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  pagination?: { page: number; pageSize: number };
} = {}) {
  const { filters, orderBy, pagination } = options;
  
  let modifiedQuery = query;
  
  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        modifiedQuery = modifiedQuery.eq(key, value);
      }
    });
  }
  
  // Apply ordering
  if (orderBy) {
    modifiedQuery = modifiedQuery.order(orderBy.column, { 
      ascending: orderBy.ascending ?? true 
    });
  }
  
  // Apply pagination
  if (pagination) {
    const { page, pageSize } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    modifiedQuery = modifiedQuery.range(from, to);
  }
  
  return modifiedQuery;
}
