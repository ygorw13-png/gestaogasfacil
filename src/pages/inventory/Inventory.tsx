
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StockAlert } from "./components/StockAlert";
import { StockOverview } from "./components/StockOverview";
import { InventoryHeader } from "./components/stock/InventoryHeader";
import { InventoryTabs } from "./components/tabs/InventoryTabs";
import { useStockData } from "./hooks/useStockData";
import { useMinStockLevels } from "./hooks/useMinStockLevels";

export default function Inventory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Use custom hooks to manage stock data
  const { currentStock, loading, fetchCurrentStock, handleStockUpdate } = useStockData();
  const { minStock, fetchMinStockLevels } = useMinStockLevels();

  // Fetch stock data and minimum stock levels when component loads or refreshCounter changes
  useEffect(() => {
    fetchCurrentStock();
  }, [fetchCurrentStock, refreshCounter]);

  // Fetch minimum stock levels when component loads
  useEffect(() => {
    fetchMinStockLevels();
  }, [fetchMinStockLevels]);

  const handleRequestCreated = () => {
    setRefreshCounter(prev => prev + 1);
    setActiveTab("requests");
  };
  
  const handleNewRequestClick = () => {
    setActiveTab("newRequest");
  };

  return (
    <div className="space-y-6">
      <InventoryHeader 
        userRole={user?.role} 
        onNewRequestClick={handleNewRequestClick} 
      />

      {/* Stock overview boxes */}
      <StockOverview currentStock={currentStock} minStock={minStock} />

      <StockAlert currentStock={currentStock} minStock={minStock} />

      <InventoryTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentStock={currentStock}
        onRequestCreated={handleRequestCreated}
        onUpdateStock={handleStockUpdate}
        refreshCounter={refreshCounter}
      />
    </div>
  );
}
