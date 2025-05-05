
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFromTable, updateInTable } from "@/services/supabaseSDK";
import { StockConfig } from "@/types/supabaseTypes";
import { Loader2 } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
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
    try {
      const { data, error } = await fetchFromTable<StockConfig[]>('configuracoes_estoque');
          
      if (error) {
        throw error;
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Mapear configurações
        const p13Setting = data.find(item => item.id === 'P13');
        const p20Setting = data.find(item => item.id === 'P20');
        const p45Setting = data.find(item => item.id === 'P45');
        const aguaSetting = data.find(item => item.id === 'agua');
        
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
    setSaving(true);
    try {
      // Atualizar P13
      await updateInTable<StockConfig>(
        'configuracoes_estoque', 
        'P13',
        { 
          estoque_minimo: storeSettings.p13Min,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString(),
          produto: 'P13'
        },
        { idColumn: 'id' }
      );
        
      // Atualizar P20
      await updateInTable<StockConfig>(
        'configuracoes_estoque', 
        'P20',
        { 
          estoque_minimo: storeSettings.p20Min,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString(),
          produto: 'P20'
        },
        { idColumn: 'id' }
      );
        
      // Atualizar P45
      await updateInTable<StockConfig>(
        'configuracoes_estoque', 
        'P45',
        { 
          estoque_minimo: storeSettings.p45Min,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString(),
          produto: 'P45'
        },
        { idColumn: 'id' }
      );
        
      // Atualizar Água
      await updateInTable<StockConfig>(
        'configuracoes_estoque', 
        'agua',
        { 
          estoque_minimo: storeSettings.aguaMin,
          alerta_ativo: storeSettings.alertsEnabled,
          atualizado_por: user?.id || '',
          atualizado_em: new Date().toISOString(),
          produto: 'agua'
        },
        { idColumn: 'id' }
      );
      
      toast({
        title: "Sucesso",
        description: "Configurações de estoque atualizadas com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao atualizar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
              <Switch 
                id="enableAlerts"
                checked={storeSettings.alertsEnabled}
                onCheckedChange={(checked) => setStoreSettings({...storeSettings, alertsEnabled: checked})}
              />
              <Label htmlFor="enableAlerts" className="text-sm font-medium">
                Habilitar alertas de estoque mínimo
              </Label>
            </div>
            
            <Button 
              onClick={handleUpdateStockSettings} 
              disabled={saving}
              className="mt-4"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
