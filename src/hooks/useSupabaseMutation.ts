
import { useState } from "react";
import { useToast } from "./use-toast";
import { PostgrestResponse, PostgrestError } from "@supabase/supabase-js";

interface UseSupabaseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<PostgrestResponse<TData>>;
  onSuccess?: (data: TData[]) => void;
  onError?: (error: PostgrestError | Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface MutationResult<TData> {
  data: TData[] | null;
  error: PostgrestError | Error | null;
}

export function useSupabaseMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage = "Ocorreu um erro"
}: UseSupabaseMutationOptions<TData, TVariables>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const { toast } = useToast();

  const mutate = async (variables: TVariables): Promise<MutationResult<TData>> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: responseError } = await mutationFn(variables);
      
      if (responseError) {
        throw responseError;
      }
      
      if (successMessage) {
        toast({
          title: "Sucesso",
          description: successMessage
        });
      }
      
      // Cast the response data to ensure it's treated as an array
      const dataArray = Array.isArray(data) ? data : data ? [data] : [];
      onSuccess?.(dataArray as TData[]);
      return { data: dataArray as TData[], error: null };
      
    } catch (err: unknown) {
      console.error("Erro na mutação:", err);
      const typedError = err as PostgrestError | Error;
      setError(typedError);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      onError?.(typedError);
      return { data: null, error: typedError };
      
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    loading,
    error
  };
}
