
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/services/supabase/utils/errorHandling";

/**
 * Hook providing standardized error handling for Supabase CRUD operations
 * This is now a wrapper around the shared error handler for backward compatibility
 */
export function useErrorHandling(options: {
  defaultErrorMessage?: string;
  showToasts?: boolean;
} = {}) {
  const { 
    error, 
    loading, 
    setLoading, 
    handleError, 
    handleSuccess, 
    resetError,
    safeExecute
  } = useErrorHandler({
    defaultErrorMessage: options.defaultErrorMessage || "Ocorreu um erro na operação",
    showToasts: options.showToasts !== false
  });

  return {
    error,
    loading,
    setLoading,
    handleError,
    handleSuccess,
    resetError,
    safeExecute
  };
}
