
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
      const response = await stockConfigTable.select();
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
      
      // Atualizações sequenciais com tratamento de erro adequado
      const updateConfigs = [
        updateStockConfig('P13', storeSettings.p13Min, storeSettings.alertsEnabled),
        updateStockConfig('P20', storeSettings.p20Min, storeSettings.alertsEnabled),
        updateStockConfig('P45', storeSettings.p45Min, storeSettings.alertsEnabled),
        updateStockConfig('agua', storeSettings.aguaMin, storeSettings.alertsEnabled)
      ];
      
      // Aguardar que todas as atualizações sejam concluídas
      const results = await Promise.all(updateConfigs);
      console.log("Resultados das atualizações:", results);
      
      // Verificar se alguma atualização falhou
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao atualizar ${errors.length} configurações`);
      }
      
      // Definir sucesso e mostrar toast
      setSuccess(true);
      toast({
        title: "Sucesso",
        description: "Configurações de estoque atualizadas com sucesso"
      });
      
      // Atualizar os dados após o salvamento bem-sucedido
      await fetchStockSettings();
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      setError(error.message || "Não foi possível atualizar as configurações");
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar as configurações",
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
  
  // Função auxiliar para atualizar uma única configuração de estoque
  const updateStockConfig = async (id: string, minStock: number, alertEnabled: boolean) => {
    if (!user) {
      return { error: new Error("Usuário não autenticado"), data: null };
    }
    
    console.log(`Atualizando configuração ${id} com estoque mínimo ${minStock}`);
    
    return stockConfigTable.update({
      id,
      estoque_minimo: minStock,
      alerta_ativo: alertEnabled,
      atualizado_por: user.id || 'sistema',
      atualizado_em: new Date().toISOString(),
      produto: id.toLowerCase()
    });
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
