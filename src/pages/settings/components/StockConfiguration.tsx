
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { customTables } from "@/integrations/supabase/customClient";

interface StockSettings {
  p13Min: number;
  p20Min: number;
  p45Min: number;
  aguaMin: number;
  alertsEnabled: boolean;
}

export function StockConfiguration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StockSettings>({
    p13Min: 20,
    p20Min: 5,
    p45Min: 5,
    aguaMin: 20,
    alertsEnabled: true
  });

  useEffect(() => {
    const fetchStockSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await customTables.stockConfig.select();
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Mapear configurações
          const p13Setting = data.find(item => item.produto === 'P13');
          const p20Setting = data.find(item => item.produto === 'P20');
          const p45Setting = data.find(item => item.produto === 'P45');
          const aguaSetting = data.find(item => item.produto === 'agua');
          
          setStoreSettings({
            p13Min: p13Setting?.estoque_minimo || 20,
            p20Min: p20Setting?.estoque_minimo || 5,
            p45Min: p45Setting?.estoque_minimo || 5,
            aguaMin: aguaSetting?.estoque_minimo || 20,
            alertsEnabled: p13Setting?.alerta_ativo !== false
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de estoque:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockSettings();
  }, []);

  const handleUpdateStockSettings = async () => {
    setLoading(true);
    try {
      // Atualizar P13
      await customTables.stockConfig.update({ 
        id: "P13", // Assume this is the ID
        estoque_minimo: storeSettings.p13Min,
        alerta_ativo: storeSettings.alertsEnabled,
        atualizado_por: user?.id || '',
        atualizado_em: new Date().toISOString()
      });
        
      // Atualizar P20
      await customTables.stockConfig.update({ 
        id: "P20", // Assume this is the ID
        estoque_minimo: storeSettings.p20Min,
        alerta_ativo: storeSettings.alertsEnabled,
        atualizado_por: user?.id || '',
        atualizado_em: new Date().toISOString()
      });
        
      // Atualizar P45
      await customTables.stockConfig.update({ 
        id: "P45", // Assume this is the ID
        estoque_minimo: storeSettings.p45Min,
        alerta_ativo: storeSettings.alertsEnabled,
        atualizado_por: user?.id || '',
        atualizado_em: new Date().toISOString()
      });
        
      // Atualizar Água
      await customTables.stockConfig.update({ 
        id: "agua", // Assume this is the ID
        estoque_minimo: storeSettings.aguaMin,
        alerta_ativo: storeSettings.alertsEnabled,
        atualizado_por: user?.id || '',
        atualizado_em: new Date().toISOString()
      });
      
      toast({
        title: "Sucesso",
        description: "Configurações de estoque atualizadas"
      });
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Estoque</CardTitle>
        <CardDescription>
          Configure os níveis mínimos de estoque e alertas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Mínimo P13</label>
            <Input 
              type="number" 
              value={storeSettings.p13Min}
              onChange={(e) => setStoreSettings({...storeSettings, p13Min: parseInt(e.target.value) || 0})}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Mínimo P20</label>
            <Input 
              type="number" 
              value={storeSettings.p20Min}
              onChange={(e) => setStoreSettings({...storeSettings, p20Min: parseInt(e.target.value) || 0})}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Mínimo P45</label>
            <Input 
              type="number" 
              value={storeSettings.p45Min}
              onChange={(e) => setStoreSettings({...storeSettings, p45Min: parseInt(e.target.value) || 0})}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Mínimo Água</label>
            <Input 
              type="number" 
              value={storeSettings.aguaMin}
              onChange={(e) => setStoreSettings({...storeSettings, aguaMin: parseInt(e.target.value) || 0})}
              min={0}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="enableAlerts"
            checked={storeSettings.alertsEnabled}
            onChange={(e) => setStoreSettings({...storeSettings, alertsEnabled: e.target.checked})}
            className="h-4 w-4 text-green-600"
          />
          <label htmlFor="enableAlerts" className="text-sm font-medium">
            Habilitar alertas de estoque mínimo
          </label>
        </div>
        
        <Button 
          onClick={handleUpdateStockSettings} 
          disabled={loading}
          className="mt-4"
        >
          {loading ? "Atualizando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
