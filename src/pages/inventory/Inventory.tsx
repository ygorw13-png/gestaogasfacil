
import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { toast } from "sonner";
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
import { exportToCsv } from "@/utils/csvExport";

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

  // Toast notification when stock drops below minimum
  const notifiedRef = useRef(false);
  useEffect(() => {
    if (loading || notifiedRef.current) return;
    const low: string[] = [];
    if (currentStock.p13 < minStock.p13) low.push("GLP P13");
    if (currentStock.p20 < minStock.p20) low.push("GLP P20");
    if (currentStock.p45 < minStock.p45) low.push("GLP P45");
    if (currentStock.water < minStock.water) low.push("Água 20L");
    if (low.length > 0) {
      toast.warning("Estoque baixo", {
        description: `Produtos abaixo do mínimo: ${low.join(", ")}`,
      });
      notifiedRef.current = true;
    }
  }, [loading, currentStock, minStock]);

  const handleExportStock = () => {
    exportToCsv(
      `estoque-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "Produto", accessor: (r: { product: string }) => r.product },
        { header: "Estoque Atual", accessor: (r: { stock: number }) => r.stock },
        { header: "Estoque Mínimo", accessor: (r: { min: number }) => r.min },
      ],
      [
        { product: "GLP P13", stock: currentStock.p13, min: minStock.p13 },
        { product: "GLP P20", stock: currentStock.p20, min: minStock.p20 },
        { product: "GLP P45", stock: currentStock.p45, min: minStock.p45 },
        { product: "Água 20L", stock: currentStock.water, min: minStock.water },
      ]
    );
  };

  const handleUpdateStock = async (newStock: StockData) => {
    await fetchCurrentStock();
    notifiedRef.current = false;
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Estoque Atual</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportStock}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
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
