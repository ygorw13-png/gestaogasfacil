
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useInventory, InventoryMovement } from "@/hooks/supabase/useInventory";
import { InventoryItemsTable } from "./InventoryItemsTable";
import { StockMovementForm } from "./StockMovementForm";
import { MovementsHistory } from "./MovementsHistory";
import { useAuth } from "@/contexts/AuthContext";
import { AlertBar } from "@/components/ui/AlertBar";
import { Loader2 } from "lucide-react";

export function InventoryApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("items");
  const {
    items,
    movements,
    loading,
    error,
    registerMovement
  } = useInventory();

  const handleMovementSubmit = async (movement: InventoryMovement) => {
    if (!user?.id) return false;
    
    const enrichedMovement = {
      ...movement,
      created_by: user.id
    };
    
    return await registerMovement(enrichedMovement);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Inventário</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Inventário</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <AlertBar
            variant="danger"
            message={error}
            className="mb-4"
          />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Itens em Estoque</TabsTrigger>
            <TabsTrigger value="movements">Registrar Movimentação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items" className="pt-4 space-y-4">
            <InventoryItemsTable items={items} />
          </TabsContent>
          
          <TabsContent value="movements" className="pt-4 space-y-4">
            <StockMovementForm 
              onSubmit={handleMovementSubmit} 
              inventoryItems={items}
            />
          </TabsContent>
          
          <TabsContent value="history" className="pt-4 space-y-4">
            <MovementsHistory movements={movements} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
