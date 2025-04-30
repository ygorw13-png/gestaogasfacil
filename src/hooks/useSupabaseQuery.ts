
import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";
import { PostgrestResponse } from "@supabase/supabase-js";

interface UseSupabaseQueryOptions<T> {
  queryFn: () => Promise<PostgrestResponse<T>>;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
  errorMessage?: string;
  enabled?: boolean;
}

export function useSupabaseQuery<T>({
  queryFn,
  onSuccess,
  onError,
  errorMessage = "Erro ao carregar dados",
  enabled = true
}: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: responseError } = await queryFn();
      
      if (responseError) {
        throw responseError;
      }
      
      if (responseData) {
        // Cast the response data to ensure it's treated as an array
        const dataArray = Array.isArray(responseData) ? responseData : [responseData];
        setData(dataArray);
        onSuccess?.(dataArray);
      }
    } catch (err: any) {
      console.error("Erro na consulta:", err);
      setError(err);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [queryFn, onSuccess, onError, errorMessage, toast]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
