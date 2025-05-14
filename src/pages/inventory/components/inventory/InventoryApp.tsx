
import React from 'react';
import { InventoryItemsTable } from './InventoryItemsTable';
import { MovementsHistory } from './MovementsHistory';
import { StockMovementForm } from './StockMovementForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function InventoryApp() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="add-movement">Nova Movimentação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="pt-4">
          <InventoryItemsTable />
        </TabsContent>
        
        <TabsContent value="movements" className="pt-4">
          <MovementsHistory />
        </TabsContent>
        
        <TabsContent value="add-movement" className="pt-4">
          <StockMovementForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
