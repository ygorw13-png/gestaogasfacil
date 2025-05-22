
import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryApp } from "../inventory";
import { StockRequestsList } from "../StockRequestsList";
import { StockRequest } from "../StockRequest";
import { CylinderControl } from "../CylinderControl";
import { StockUpdateForm } from "../StockUpdateForm";
import { StockData } from "../stock/StockData";

interface InventoryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentStock: StockData;
  onRequestCreated: () => void;
  onUpdateStock: (newStock: StockData) => Promise<void>;
  refreshCounter: number;
}

export function InventoryTabs({
  activeTab,
  setActiveTab,
  currentStock,
  onRequestCreated,
  onUpdateStock,
  refreshCounter
}: InventoryTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="inventory">Inventário</TabsTrigger>
        <TabsTrigger value="requests">Requisições</TabsTrigger>
        <TabsTrigger value="newRequest">Nova Requisição</TabsTrigger>
        <TabsTrigger value="cylinders">Vasilhames</TabsTrigger>
        <TabsTrigger value="update">Atualizar Estoque</TabsTrigger>
      </TabsList>
      
      <TabsContent value="inventory" className="space-y-4">
        <InventoryApp />
      </TabsContent>
      
      <TabsContent value="requests" className="space-y-4">
        <StockRequestsList key={refreshCounter} />
      </TabsContent>
      
      <TabsContent value="newRequest" className="space-y-4">
        <StockRequest onRequestCreated={onRequestCreated} />
      </TabsContent>

      <TabsContent value="cylinders" className="space-y-4">
        <CylinderControl />
      </TabsContent>
      
      <TabsContent value="update" className="space-y-4">
        <StockUpdateForm 
          currentStock={currentStock}
          onUpdateStock={onUpdateStock}
        />
      </TabsContent>
    </Tabs>
  );
}
