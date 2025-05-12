
import { Card, CardContent } from "@/components/ui/card";
import { Archive, Droplet, Archive as ArchiveIcon20, Archive as ArchiveIcon45 } from "lucide-react";

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
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className={currentStock.p13 < minStock.p13 ? "border-red-500" : "border-gray-200"}>
        <CardContent className="pt-6 px-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{currentStock.p13}</div>
            <p className="text-sm text-muted-foreground">Estoque GLP P13</p>
            <p className="text-xs text-gray-500">Mínimo: {minStock.p13}</p>
          </div>
          <Archive className="h-10 w-10 text-blue-600 opacity-80" />
        </CardContent>
      </Card>
      
      <Card className={currentStock.p20 < minStock.p20 ? "border-red-500" : "border-gray-200"}>
        <CardContent className="pt-6 px-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{currentStock.p20}</div>
            <p className="text-sm text-muted-foreground">Estoque GLP P20</p>
            <p className="text-xs text-gray-500">Mínimo: {minStock.p20}</p>
          </div>
          <ArchiveIcon20 className="h-10 w-10 text-green-600 opacity-80" />
        </CardContent>
      </Card>
      
      <Card className={currentStock.p45 < minStock.p45 ? "border-red-500" : "border-gray-200"}>
        <CardContent className="pt-6 px-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{currentStock.p45}</div>
            <p className="text-sm text-muted-foreground">Estoque GLP P45</p>
            <p className="text-xs text-gray-500">Mínimo: {minStock.p45}</p>
          </div>
          <ArchiveIcon45 className="h-10 w-10 text-indigo-600 opacity-80" />
        </CardContent>
      </Card>
      
      <Card className={currentStock.water < minStock.water ? "border-red-500" : "border-gray-200"}>
        <CardContent className="pt-6 px-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{currentStock.water}</div>
            <p className="text-sm text-muted-foreground">Estoque Água 20L</p>
            <p className="text-xs text-gray-500">Mínimo: {minStock.water}</p>
          </div>
          <Droplet className="h-10 w-10 text-cyan-600 opacity-80" />
        </CardContent>
      </Card>
    </div>
  );
}
