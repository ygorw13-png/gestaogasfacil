
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { stockConfigTable } from "@/integrations/supabase/tables/stockConfig";
import { StockSettings } from "../components/stock-config/StockLevelInputs";
import { fetchFromTable } from "@/services/supabaseSDK";

export function useStockConfiguration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StockSettings>({
    p13Min: 20,
    p20Min: 5,
    p45Min: 5,
    aguaMin: 20,
    alertsEnabled: true
  });

  const fetchStockSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Buscando configurações de estoque...");
      
      // Using fetchFromTable directly to get configurations
      const response = await fetchFromTable('configuracoes_estoque', {});
      console.log("Response from query:", response);
          
      if (response.error) {
        throw response.error;
      }
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Map configurations
        const p13Setting = response.data.find(item => item.id === 'P13');
        const p20Setting = response.data.find(item => item.id === 'P20');
        const p45Setting = response.data.find(item => item.id === 'P45');
        const aguaSetting = response.data.find(item => item.id === 'agua');
        
        console.log("Found configurations:", { p13Setting, p20Setting, p45Setting, aguaSetting });
        
        setStoreSettings({
          // ?? preserva zero configurado; o padrão só vale quando não há registro
          p13Min: p13Setting?.estoque_minimo ?? 20,
          p20Min: p20Setting?.estoque_minimo ?? 5,
          p45Min: p45Setting?.estoque_minimo ?? 5,
          aguaMin: aguaSetting?.estoque_minimo ?? 20,
          alertsEnabled: p13Setting?.alerta_ativo !== false // Default to true if undefined
        });
      } else {
        console.log("No configurations found or empty response");
      }
    } catch (error) {
      console.error("Error loading stock configurations:", error);
      setError("Não foi possível carregar as configurações de estoque");
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de estoque",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function for upserting stock config (create if not exists, update if exists)
  const upsertStockConfig = async (id: string, produto: string, minStock: number, alertEnabled: boolean) => {
    if (!user) {
      return { error: new Error("Usuário não autenticado"), data: null };
    }
    
    console.log(`Updating configuration ${id} with min stock ${minStock}`);
    
    try {
      // Prepare data for upsert
      const stockConfigData = {
        id,
        produto: produto.toLowerCase(),
        estoque_minimo: minStock,
        alerta_ativo: alertEnabled,
        atualizado_por: user.id || 'sistema',
        atualizado_em: new Date().toISOString()
      };
      
      // Use the upsert method
      const result = await stockConfigTable.upsert(stockConfigData);
      
      console.log(`Result of updating ${id}:`, result);
      return result;
    } catch (err) {
      console.error(`Error updating configuration ${id}:`, err);
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  };

  const handleUpdateStockSettings = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      console.log("Starting configuration update with values:", storeSettings);
      
      // Process configurations one by one to get individual errors
      const results = [];
      const errors = [];
      
      // Update P13
      console.log("Updating P13 with min stock:", storeSettings.p13Min);
      const p13Result = await upsertStockConfig('P13', 'p13', storeSettings.p13Min, storeSettings.alertsEnabled);
      results.push(p13Result);
      if (p13Result.error) errors.push(`P13: ${p13Result.error.message}`);
      
      // Update P20
      console.log("Updating P20 with min stock:", storeSettings.p20Min);
      const p20Result = await upsertStockConfig('P20', 'p20', storeSettings.p20Min, storeSettings.alertsEnabled);
      results.push(p20Result);
      if (p20Result.error) errors.push(`P20: ${p20Result.error.message}`);
      
      // Update P45
      console.log("Updating P45 with min stock:", storeSettings.p45Min);
      const p45Result = await upsertStockConfig('P45', 'p45', storeSettings.p45Min, storeSettings.alertsEnabled);
      results.push(p45Result);
      if (p45Result.error) errors.push(`P45: ${p45Result.error.message}`);
      
      // Update Água
      console.log("Updating Água with min stock:", storeSettings.aguaMin);
      const aguaResult = await upsertStockConfig('agua', 'agua', storeSettings.aguaMin, storeSettings.alertsEnabled);
      results.push(aguaResult);
      if (aguaResult.error) errors.push(`Água: ${aguaResult.error.message}`);
      
      // Check for errors
      if (errors.length > 0) {
        console.error("Errors found:", errors);
        throw new Error(`Erro ao atualizar configurações: ${errors.join(', ')}`);
      }
      
      // Set success and show toast
      console.log("All configurations were updated successfully!");
      setSuccess(true);
      toast({
        title: "Sucesso",
        description: "Configurações de estoque atualizadas com sucesso"
      });
      
      // Update data after successful save
      await fetchStockSettings();
    } catch (error: any) {
      console.error("Error updating configurations:", error);
      
      // More detailed error message
      const errorMessage = error.message || "Não foi possível atualizar as configurações";
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      
      // Hide success message after 5 seconds
      if (success) {
        setTimeout(() => setSuccess(false), 5000);
      }
    }
  };

  useEffect(() => {
    fetchStockSettings();
  }, []);

  return {
    loading,
    saving,
    success,
    error,
    storeSettings,
    setStoreSettings,
    handleUpdateStockSettings,
    setError
  };
}
