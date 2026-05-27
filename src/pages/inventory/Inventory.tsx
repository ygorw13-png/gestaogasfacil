
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryHeader } from "./components/stock/InventoryHeader";
import { useStockData } from "./hooks/useStockData";
import { useMinStockLevels } from "./hooks/useMinStockLevels";
import { InventoryItemTable } from "./components/stock/InventoryItemTable";
import { StockUpdateForm } from "./components/StockUpdateForm";
import { StockAlert } from "./components/StockAlert";
import { StockRequestsList } from "./components/StockRequestsList";
import { StockRequest } from "./components/StockRequest";
import { CylinderControl } from "./components/CylinderControl";
import { useAuth } from "@/contexts/auth";
import { InventoryApp } from "./components/inventory";
import { UserRole } from "@/types/userTypes";
import { StockData, defaultStockData } from "./components/stock/StockData";
import { InventoryTableSkeleton } from "./components/InventoryTableSkeleton";

const Inventory = () => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Get user role from auth context
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;
  
  // Get stock data and stock levels
  const { currentStock, loading, fetchCurrentStock } = useStockData();
  const { minStock, fetchMinStockLevels } = useMinStockLevels();

  // Load data on component mount
  useEffect(() => {
    fetchCurrentStock();
    fetchMinStockLevels();
  }, [fetchCurrentStock, fetchMinStockLevels]);

  const handleUpdateStock = async (newStock: StockData) => {
    await fetchCurrentStock();
    // You may want to show a success message here
  };

  const handleRequestCreated = () => {
    setShowRequestForm(false);
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6">
      {showRequestForm ? (
        <StockRequest 
          onRequestCreated={handleRequestCreated} 
          onCancel={() => setShowRequestForm(false)} 
        />
      ) : (
        <>
          <InventoryHeader
            userRole={userRole}
            onNewRequestClick={() => setShowRequestForm(true)}
          />

          <div className="mt-6">
            {!loading && <StockAlert currentStock={currentStock} minStock={minStock} />}

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="requests">Requisições</TabsTrigger>
                <TabsTrigger value="cylinders">Controle de Cascos</TabsTrigger>
                <TabsTrigger value="advanced">Gerenciamento Avançado</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card className="p-4">
                  <h2 className="text-xl font-semibold mb-4">Estoque Atual</h2>
                  {loading ? (
                    <InventoryTableSkeleton rows={4} columns={5} />
                  ) : (
                    <>
                      <InventoryItemTable 
                        currentStock={currentStock} 
                        minStock={minStock} 
                      />
                      <div className="mt-6">
                        <StockUpdateForm 
                          currentStock={currentStock}
                          onUpdateStock={handleUpdateStock}
                        />
                      </div>
                    </>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="mt-4">
                <StockRequestsList />
              </TabsContent>

              <TabsContent value="cylinders" className="mt-4">
                <CylinderControl />
              </TabsContent>

              <TabsContent value="advanced" className="mt-4">
                <InventoryApp />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
