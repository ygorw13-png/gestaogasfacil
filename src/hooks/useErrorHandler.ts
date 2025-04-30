
import { useState } from 'react';
import { useToast } from './use-toast';

interface ErrorHandlerOptions {
  toastOnError?: boolean;
  defaultErrorMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { toastOnError = true, defaultErrorMessage = 'Ocorreu um erro inesperado.' } = options;
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const handleError = (err: unknown, customMessage?: string) => {
    const errorMessage = customMessage || 
      (err instanceof Error ? err.message : defaultErrorMessage);
    
    console.error('Erro capturado:', err);
    
    // Salvar o erro no estado
    setError(err instanceof Error ? err : new Error(errorMessage));
    
    // Mostrar toast se configurado
    if (toastOnError) {
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    return { message: errorMessage };
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}
