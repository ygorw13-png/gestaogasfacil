
import { useState, useCallback } from 'react';
import { stockConfigTable } from '@/integrations/supabase/tables/stockConfig';
import { StockConfig } from '@/types/supabaseTypes';
import { useToast } from './use-toast';

export function useStockConfig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchStockConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await stockConfigTable.select();
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar configurações de estoque';
      setError(new Error(errorMessage));
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações de estoque',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateStockConfig = useCallback(async (config: Partial<StockConfig> & { id: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await stockConfigTable.update(config);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Sucesso',
        description: 'Configuração de estoque atualizada com sucesso'
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configuração de estoque';
      setError(new Error(errorMessage));
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a configuração de estoque',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createStockConfig = useCallback(async (config: StockConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await stockConfigTable.insert(config);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Sucesso',
        description: 'Configuração de estoque criada com sucesso'
      });
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar configuração de estoque';
      setError(new Error(errorMessage));
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a configuração de estoque',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    fetchStockConfig,
    updateStockConfig,
    createStockConfig
  };
}
