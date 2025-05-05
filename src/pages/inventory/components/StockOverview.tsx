
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchFromTable } from "@/services/supabaseSDK";
import { StockConfig } from "@/types/supabaseTypes";

interface StockOverviewProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function StockOverview({ currentStock }: StockOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [minStock, setMinStock] = useState({
    p13: 20,
    p20: 5,
    p45: 5,
    water: 20
  });

  useEffect(() => {
    const fetchStockConfig = async () => {
      try {
        const { data, error } = await fetchFromTable<StockConfig[]>('configuracoes_estoque');
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          const p13Config = data.find(item => item.id === 'P13');
          const p20Config = data.find(item => item.id === 'P20');
          const p45Config = data.find(item => item.id === 'P45');
          const aguaConfig = data.find(item => item.id === 'agua');
          
          setMinStock({
            p13: p13Config?.estoque_minimo || 20,
            p20: p20Config?.estoque_minimo || 5,
            p45: p45Config?.estoque_minimo || 5,
            water: aguaConfig?.estoque_minimo || 20
          });
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de estoque:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockConfig();
  }, []);
  
  const getStockStatus = (current: number, min: number) => {
    if (current <= 0) return { status: 'critical', color: 'bg-red-500' };
    if (current < min) return { status: 'low', color: 'bg-yellow-500' };
    return { status: 'ok', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <TooltipProvider>
        {[
          { name: 'GLP P13', value: currentStock.p13, min: minStock.p13 },
          { name: 'GLP P20', value: currentStock.p20, min: minStock.p20 },
          { name: 'GLP P45', value: currentStock.p45, min: minStock.p45 },
          { name: 'Água 20L', value: currentStock.water, min: minStock.water }
        ].map((item) => {
          const { status, color } = getStockStatus(item.value, item.min);
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Card className="p-4 relative overflow-hidden">
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`}></div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    {status === 'ok' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className={`h-5 w-5 ${status === 'low' ? 'text-yellow-500' : 'text-red-500'}`} />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold">{item.value}</div>
                    <div className="text-xs text-muted-foreground">
                      Mínimo: {item.min}
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {status === 'ok' 
                    ? 'Estoque adequado' 
                    : status === 'low' 
                      ? 'Estoque baixo, considere reabastecer' 
                      : 'Estoque crítico!'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
