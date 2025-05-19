
import { useState, useCallback } from "react";
import { useToast } from "./use-toast";
import { PostgrestError } from "@supabase/supabase-js";

interface UseSupabaseMutationOptions<TData> {
  mutationFn: (variables: any) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (error: PostgrestError | Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
  retryEnabled?: boolean;
  retryCount?: number;
}

interface MutationResult<TData> {
  data: TData | null;
  error: PostgrestError | Error | null;
}

export function useSupabaseMutation<TData = unknown>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage = "Ocorreu um erro",
  showToast = true,
  retryEnabled = false,
  retryCount = 1
}: UseSupabaseMutationOptions<TData>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const { toast } = useToast();

  // Simplified type handling - variables can be any type
  const mutate = useCallback(async (variables: any): Promise<MutationResult<TData>> => {
    setLoading(true);
    setError(null);
    
    let attempts = 0;
    let lastError: PostgrestError | Error | null = null;

    while (attempts <= (retryEnabled ? retryCount : 0)) {
      try {
        const result = await mutationFn(variables);
        
        if (showToast && successMessage) {
          toast({
            title: "Sucesso",
            description: successMessage
          });
        }
        
        // Call onSuccess callback with the result
        onSuccess?.(result);
        
        return { data: result, error: null };
        
      } catch (err: unknown) {
        console.error(`Erro na mutação (tentativa ${attempts + 1}):`, err);
        lastError = err as PostgrestError | Error;
        attempts++;
        
        // If we're not retrying or we've reached the limit, handle the error
        if (!retryEnabled || attempts > retryCount) {
          setError(lastError);
          
          if (showToast) {
            toast({
              title: "Erro",
              description: errorMessage,
              variant: "destructive"
            });
          }
          
          onError?.(lastError);
          break;
        }
        
        // Wait before trying again (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 500));
      }
    }
    
    setLoading(false);
    return { data: null, error: lastError };
  }, [mutationFn, onSuccess, onError, successMessage, errorMessage, toast, showToast, retryEnabled, retryCount]);

  return {
    mutate,
    loading,
    error,
    reset: useCallback(() => setError(null), [])
  };
}
