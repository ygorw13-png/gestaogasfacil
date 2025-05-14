
import React from 'react';
import { InventoryItemsTable } from './table';
import { MovementsHistory } from './MovementsHistory';
import { StockMovementForm } from './stock-movement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventoryData } from '@/hooks/supabase/useInventory';

export function InventoryApp() {
  const { 
    items, 
    movements, 
    loading, 
    registerMovement 
  } = useInventoryData();

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="inventory">Inventário</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="add-movement">Nova Movimentação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="pt-4">
            <InventoryItemsTable items={items} />
          </TabsContent>
          
          <TabsContent value="movements" className="pt-4">
            <MovementsHistory movements={movements} />
          </TabsContent>
          
          <TabsContent value="add-movement" className="pt-4">
            <StockMovementForm onSubmit={registerMovement} inventoryItems={items} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
