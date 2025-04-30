
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StockOverviewProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  minStock?: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
}

export function StockOverview({ 
  currentStock,
  minStock = { p13: 20, p20: 5, p45: 5, water: 20 }
}: StockOverviewProps) {
  
  const getStockStatus = (current: number, min: number) => {
    if (current <= 0) return { status: 'critical', color: 'bg-red-500' };
    if (current < min) return { status: 'low', color: 'bg-yellow-500' };
    return { status: 'ok', color: 'bg-green-500' };
  };

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
