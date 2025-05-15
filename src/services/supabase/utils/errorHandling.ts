
import { useState, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export interface ErrorHandlerOptions {
  showToasts?: boolean;
  defaultErrorMessage?: string;
}

/**
 * Hook providing standardized error handling for Supabase operations
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToasts = true,
    defaultErrorMessage = "An error occurred"
  } = options;
  
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const message = customMessage || defaultErrorMessage;
    console.error("Operation error:", error);
    
    const typedError = error instanceof Error 
      ? error 
      : new Error(String(error));
    
    setError(typedError);
    
    if (showToasts) {
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
    
    return typedError;
  }, [defaultErrorMessage, showToasts, toast]);
  
  const handleSuccess = useCallback((message?: string) => {
    setError(null);
    
    if (showToasts && message) {
      toast({
        title: "Success",
        description: message
      });
    }
  }, [showToasts, toast]);
  
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Executes a Supabase operation with standardized error handling
   */
  const safeExecute = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      handleError(err, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);
  
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
