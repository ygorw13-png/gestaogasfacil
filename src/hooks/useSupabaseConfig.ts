
import { useState, useCallback } from "react";
import { useToast } from "./use-toast";
import { PostgrestError } from "@supabase/supabase-js";

interface SupabaseConfigOptions<T> {
  fetchFn: (organizationId: string) => Promise<any>;
  updateFn: (data: T) => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  initialData?: T;
}

export function useSupabaseConfig<T extends Record<string, any>>(
  organizationId: string | undefined,
  options: SupabaseConfigOptions<T>
) {
  const { fetchFn, updateFn, successMessage = "Configurações salvas com sucesso", errorMessage = "Erro ao salvar configurações" } = options;
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFn(organizationId);
      
      // Safely check for errors in the response
      if (response && typeof response === 'object' && 'error' in response && response.error) {
        throw new Error(response.error.message || 'Erro desconhecido');
      }
      
      if (response.data) {
        setData(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao carregar dados:", error);
      setError(errorMessage);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [organizationId, fetchFn, toast]);

  const saveData = useCallback(async (formData: T) => {
    if (!organizationId) {
      toast({
        title: "Erro",
        description: "Dados da organização não disponíveis",
        variant: "destructive"
      });
      return false;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const dataToSave = {
        ...formData,
        organization_id: organizationId
      };
      
      const result = await updateFn(dataToSave as T);
      
      // Safely check for errors in the result
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        throw new Error(result.error.message || 'Erro desconhecido');
      }
      
      setData(formData);
      
      toast({
        title: "Sucesso",
        description: successMessage
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Erro ao salvar dados:", error);
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage || "Não foi possível salvar os dados",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setSaving(false);
    }
  }, [organizationId, updateFn, successMessage, toast]);

  return {
    data,
    loading,
    saving,
    error,
    fetchData,
    saveData,
    setData
  };
}
