
import { useState } from 'react';
import { useSupabaseErrorHandler } from "../useSupabaseHelpers";

/**
 * Hook for managing error states and loading indicators in Supabase operations
 */
export function useErrorHandling() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleError, handleSuccess } = useSupabaseErrorHandler();

  // Simple operation executor with error handling
  const safeExecute = async <R>(
    operation: () => Promise<R>,
    errorMessage: string
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      handleError(err, errorMessage);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    resetError: () => setError(null),
    safeExecute,
    handleSuccess,
    handleError
  };
}
