
import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";
import { PostgrestError } from "@supabase/supabase-js";

interface UseSupabaseQueryOptions<T> {
  queryFn: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: PostgrestError | Error) => void;
  errorMessage?: string;
  showErrorToast?: boolean;
  enabled?: boolean;
  retryCount?: number;
  retryDelay?: number;
  queryKey?: any[];
}

export function useSupabaseQuery<T>({
  queryFn,
  onSuccess,
  onError,
  errorMessage = "Erro ao carregar dados",
  showErrorToast = true,
  enabled = true,
  retryCount = 0,
  retryDelay = 2000,
  queryKey = []
}: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T>([] as unknown as T);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [retries, setRetries] = useState(0);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const responseData = await queryFn();
      setData(responseData);
      onSuccess?.(responseData);
      // Reset retry count on success
      setRetries(0);
    } catch (err: unknown) {
      console.error("Erro na consulta:", err);
      const typedError = err as PostgrestError | Error;
      setError(typedError);
      
      if (showErrorToast) {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      onError?.(typedError);

      // Try again if we haven't reached the retry limit
      if (retries < retryCount) {
        setTimeout(() => {
          setRetries(prev => prev + 1);
          fetchData();
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, onSuccess, onError, errorMessage, toast, showErrorToast, retries, retryCount, retryDelay]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData, ...queryKey]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
