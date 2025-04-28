
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StockConfig } from "@/types/supabaseTypes";

interface StockAlertProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function StockAlert({ currentStock }: StockAlertProps) {
  const [stockConfigs, setStockConfigs] = useState<StockConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockConfigs = async () => {
      try {
        // Use the type cast to tell TypeScript this query is valid
        const { data, error } = await supabase
          .from('configuracoes_estoque')
          .select('*') as { data: StockConfig[] | null, error: any };
        
        if (error) throw error;
        
        if (data) {
          setStockConfigs(data);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de estoque:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockConfigs();
  }, []);

  const getAlerts = () => {
    if (loading || stockConfigs.length === 0) return [];
    
    const alerts = [];
    
    // Verificar P13
    const p13Config = stockConfigs.find(config => config.produto === 'P13');
    if (p13Config && p13Config.alerta_ativo && currentStock.p13 < p13Config.estoque_minimo) {
      alerts.push({
        product: "GLP P13",
        current: currentStock.p13,
        minimum: p13Config.estoque_minimo
      });
    }
    
    // Verificar P20
    const p20Config = stockConfigs.find(config => config.produto === 'P20');
    if (p20Config && p20Config.alerta_ativo && currentStock.p20 < p20Config.estoque_minimo) {
      alerts.push({
        product: "GLP P20",
        current: currentStock.p20,
        minimum: p20Config.estoque_minimo
      });
    }
    
    // Verificar P45
    const p45Config = stockConfigs.find(config => config.produto === 'P45');
    if (p45Config && p45Config.alerta_ativo && currentStock.p45 < p45Config.estoque_minimo) {
      alerts.push({
        product: "GLP P45",
        current: currentStock.p45,
        minimum: p45Config.estoque_minimo
      });
    }
    
    // Verificar Água
    const aguaConfig = stockConfigs.find(config => config.produto === 'agua');
    if (aguaConfig && aguaConfig.alerta_ativo && currentStock.water < aguaConfig.estoque_minimo) {
      alerts.push({
        product: "Água 20L",
        current: currentStock.water,
        minimum: aguaConfig.estoque_minimo
      });
    }
    
    return alerts;
  };

  const alerts = getAlerts();
  
  if (loading) {
    return <div>Carregando alertas...</div>;
  }
  
  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> 
          Alertas de Estoque Mínimo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="destructive" className="bg-white border-orange-300">
              <AlertTitle className="text-orange-800">{alert.product}</AlertTitle>
              <AlertDescription className="text-orange-700">
                Estoque atual: <strong>{alert.current}</strong> unidades
                <br/>
                Estoque mínimo recomendado: <strong>{alert.minimum}</strong> unidades
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
