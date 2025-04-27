
import { Card } from "@/components/ui/card";

interface StockGridProps {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  movements: {
    P13: { loan: number; return: number; net: number };
    P20: { loan: number; return: number; net: number };
    P45: { loan: number; return: number; net: number };
    water: { loan: number; return: number; net: number };
  };
}

export function StockGrid({ currentStock, movements }: StockGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-md border p-4 text-center">
        <div className="text-2xl font-semibold">{currentStock.p13}</div>
        <div className="text-sm text-muted-foreground">GLP P13</div>
        <div className={`text-xs mt-1 ${movements.P13.net < 0 ? 'text-red-500' : movements.P13.net > 0 ? 'text-green-500' : ''}`}>
          {movements.P13.net !== 0 ? `${movements.P13.net > 0 ? '+' : ''}${movements.P13.net}` : ''}
        </div>
      </div>
      <div className="rounded-md border p-4 text-center">
        <div className="text-2xl font-semibold">{currentStock.p20}</div>
        <div className="text-sm text-muted-foreground">GLP P20</div>
        <div className={`text-xs mt-1 ${movements.P20.net < 0 ? 'text-red-500' : movements.P20.net > 0 ? 'text-green-500' : ''}`}>
          {movements.P20.net !== 0 ? `${movements.P20.net > 0 ? '+' : ''}${movements.P20.net}` : ''}
        </div>
      </div>
      <div className="rounded-md border p-4 text-center">
        <div className="text-2xl font-semibold">{currentStock.p45}</div>
        <div className="text-sm text-muted-foreground">GLP P45</div>
        <div className={`text-xs mt-1 ${movements.P45.net < 0 ? 'text-red-500' : movements.P45.net > 0 ? 'text-green-500' : ''}`}>
          {movements.P45.net !== 0 ? `${movements.P45.net > 0 ? '+' : ''}${movements.P45.net}` : ''}
        </div>
      </div>
      <div className="rounded-md border p-4 text-center">
        <div className="text-2xl font-semibold">{currentStock.water}</div>
        <div className="text-sm text-muted-foreground">Água 20L</div>
        <div className={`text-xs mt-1 ${movements.water.net < 0 ? 'text-red-500' : movements.water.net > 0 ? 'text-green-500' : ''}`}>
          {movements.water.net !== 0 ? `${movements.water.net > 0 ? '+' : ''}${movements.water.net}` : ''}
        </div>
      </div>
    </div>
  );
}
