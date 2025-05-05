
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { stockConfigTable } from "@/integrations/supabase/tables/stockConfig";
import { StockConfigHeader } from "./stock-config/StockConfigHeader";
import { StockLevelInputs, StockSettings } from "./stock-config/StockLevelInputs";
import { StockConfigActions } from "./stock-config/StockConfigActions";
import { AlertBar } from "@/components/ui/AlertBar";
import { fetchFromTable } from "@/services/supabaseSDK";

export function StockConfiguration() {
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

  useEffect(() => {
    fetchStockSettings();
  }, []);

  const fetchStockSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Buscando configurações de estoque...");
      
      // Usando fetchFromTable diretamente para buscar as configurações
      const response = await fetchFromTable('configuracoes_estoque', {});
      console.log("Resposta da busca:", response);
          
      if (response.error) {
        throw response.error;
      }
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Mapear configurações
        const p13Setting = response.data.find(item => item.id === 'P13');
        const p20Setting = response.data.find(item => item.id === 'P20');
        const p45Setting = response.data.find(item => item.id === 'P45');
        const aguaSetting = response.data.find(item => item.id === 'agua');
        
        console.log("Configurações encontradas:", { p13Setting, p20Setting, p45Setting, aguaSetting });
        
        setStoreSettings({
          p13Min: p13Setting?.estoque_minimo || 20,
          p20Min: p20Setting?.estoque_minimo || 5,
          p45Min: p45Setting?.estoque_minimo || 5,
          aguaMin: aguaSetting?.estoque_minimo || 20,
          alertsEnabled: p13Setting?.alerta_ativo !== false // Default para true se indefinido
        });
      } else {
        console.log("Nenhuma configuração encontrada ou resposta vazia");
      }
    } catch (error) {
      console.error("Erro ao carregar configurações de estoque:", error);
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
      console.log("Iniciando atualização de configurações com valores:", storeSettings);
      
      // Processar configurações uma por uma para obter erros individuais
      const results = [];
      const errors = [];
      
      // Atualizar P13
      console.log("Atualizando P13 com estoque mínimo:", storeSettings.p13Min);
      const p13Result = await upsertStockConfig('P13', 'p13', storeSettings.p13Min, storeSettings.alertsEnabled);
      results.push(p13Result);
      if (p13Result.error) errors.push(`P13: ${p13Result.error.message}`);
      
      // Atualizar P20
      console.log("Atualizando P20 com estoque mínimo:", storeSettings.p20Min);
      const p20Result = await upsertStockConfig('P20', 'p20', storeSettings.p20Min, storeSettings.alertsEnabled);
      results.push(p20Result);
      if (p20Result.error) errors.push(`P20: ${p20Result.error.message}`);
      
      // Atualizar P45
      console.log("Atualizando P45 com estoque mínimo:", storeSettings.p45Min);
      const p45Result = await upsertStockConfig('P45', 'p45', storeSettings.p45Min, storeSettings.alertsEnabled);
      results.push(p45Result);
      if (p45Result.error) errors.push(`P45: ${p45Result.error.message}`);
      
      // Atualizar Água
      console.log("Atualizando Água com estoque mínimo:", storeSettings.aguaMin);
      const aguaResult = await upsertStockConfig('agua', 'agua', storeSettings.aguaMin, storeSettings.alertsEnabled);
      results.push(aguaResult);
      if (aguaResult.error) errors.push(`Água: ${aguaResult.error.message}`);
      
      // Verificar se houve erros
      if (errors.length > 0) {
        console.error("Erros encontrados:", errors);
        throw new Error(`Erro ao atualizar configurações: ${errors.join(', ')}`);
      }
      
      // Definir sucesso e mostrar toast
      console.log("Todas as configurações foram atualizadas com sucesso!");
      setSuccess(true);
      toast({
        title: "Sucesso",
        description: "Configurações de estoque atualizadas com sucesso"
      });
      
      // Atualizar os dados após o salvamento bem-sucedido
      await fetchStockSettings();
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      
      // Mensagem de erro mais detalhada
      const errorMessage = error.message || "Não foi possível atualizar as configurações";
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      
      // Esconder mensagem de sucesso após 5 segundos
      if (success) {
        setTimeout(() => setSuccess(false), 5000);
      }
    }
  };
  
  // Função para upsert de configuração (cria se não existir, atualiza se existir)
  const upsertStockConfig = async (id: string, produto: string, minStock: number, alertEnabled: boolean) => {
    if (!user) {
      return { error: new Error("Usuário não autenticado"), data: null };
    }
    
    console.log(`Atualizando configuração ${id} com estoque mínimo ${minStock}`);
    
    try {
      // Preparar dados para upsert
      const stockConfigData = {
        id,
        produto: produto.toLowerCase(),
        estoque_minimo: minStock,
        alerta_ativo: alertEnabled,
        atualizado_por: user.id || 'sistema',
        atualizado_em: new Date().toISOString()
      };
      
      // Usar o método upsert
      const result = await stockConfigTable.upsert(stockConfigData);
      
      console.log(`Resultado da atualização de ${id}:`, result);
      return result;
    } catch (err) {
      console.error(`Erro ao atualizar configuração ${id}:`, err);
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
  };

  return (
    <Card>
      <StockConfigHeader />
      <CardContent className="space-y-4">
        {success && (
          <AlertBar
            variant="success"
            message="Configurações de estoque salvas com sucesso!"
            hideAfter={5000}
          />
        )}
        
        {error && (
          <AlertBar
            variant="danger"
            message={error}
            onClose={() => setError(null)}
          />
        )}
      
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StockLevelInputs 
              settings={storeSettings} 
              onSettingsChange={setStoreSettings} 
              disabled={saving}
            />
            
            <StockConfigActions 
              onSave={handleUpdateStockSettings} 
              saving={saving} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
