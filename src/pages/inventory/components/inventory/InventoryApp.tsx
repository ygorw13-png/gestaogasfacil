
import React, { useState } from 'react';
import { InventoryItemsTable } from './table';
import { MovementsHistory } from './movements';
import { StockMovementForm } from './stock-movement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventoryData } from '@/hooks/supabase/useInventory';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { InventoryAppProps } from './types';
import { InventoryTableSkeleton } from '../InventoryTableSkeleton';

export function InventoryApp({ className = "" }: InventoryAppProps) {
  const [activeTab, setActiveTab] = useState<string>("inventory");
  
  const { 
    items, 
    movements, 
    loading, 
    error,
    registerMovement,
    refreshItems,
    refreshMovements
  } = useInventoryData();

  // Error handling
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Ocorreu um erro ao carregar os dados de inventário. 
          Por favor, tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {loading ? (
        <InventoryTableSkeleton rows={6} columns={5} />
      ) : (
        <Tabs 
          defaultValue="inventory" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="inventory">Inventário</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="add-movement">Nova Movimentação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="pt-4">
            <InventoryItemsTable 
              items={items} 
              isLoading={loading} 
              error={error} 
            />
          </TabsContent>
          
          <TabsContent value="movements" className="pt-4">
            <MovementsHistory 
              movements={movements} 
              isLoading={loading} 
              error={error}
            />
          </TabsContent>
          
          <TabsContent value="add-movement" className="pt-4">
            <StockMovementForm 
              onSubmit={registerMovement} 
              inventoryItems={items}
              isLoading={loading}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
