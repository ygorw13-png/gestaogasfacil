
import { useState } from "react";
import { useToast } from "./use-toast";
import { PostgrestResponse } from "@supabase/supabase-js";

interface UseSupabaseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<PostgrestResponse<TData>>;
  onSuccess?: (data: TData[]) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useSupabaseMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage = "Ocorreu um erro"
}: UseSupabaseMutationOptions<TData, TVariables>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const mutate = async (variables: TVariables) => {
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
      
      onSuccess?.(data);
      return { data, error: null };
      
    } catch (err: any) {
      console.error("Erro na mutação:", err);
      setError(err);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      onError?.(err);
      return { data: null, error: err };
      
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
