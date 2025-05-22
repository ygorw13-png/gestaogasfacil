
import { useCallback, useState } from "react";
import { fetchData } from "@/services/supabase/crud";
import { useToast } from "@/hooks/use-toast";
import { syncStockWithDashboard } from "@/pages/dashboard/data";
import { StockData, defaultStockData } from "../components/stock/StockData";

export function useStockData() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentStock, setCurrentStock] = useState<StockData>(defaultStockData);
  
  // Function to fetch current stock from dashboard
  const fetchCurrentStock = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch data from dashboard
      const response = await fetchData('dashboard_data', {
        columns: 'stock_data'
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data && response.data.length > 0 && response.data[0].stock_data) {
        // Cast the data to our expected type with proper typing
        const stockData = response.data[0].stock_data as unknown as StockData;
        
        setCurrentStock({
          p13: stockData.p13 || 0,
          p20: stockData.p20 || 0,
          p45: stockData.p45 || 0,
          water: stockData.water || 0
        });
      } else {
        // Use default values if no data is available
        setCurrentStock({
          p13: 15,
          p20: 10,
          p45: 3,
          water: 25
        });
      }
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de estoque",
        variant: "destructive"
      });
      
      // Use default values in case of error
      setCurrentStock({
        p13: 15,
        p20: 10,
        p45: 3,
        water: 25
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Function to update stock data
  const handleStockUpdate = async (newStock: StockData) => {
    try {
      // Update local stock
      setCurrentStock(newStock);
      
      // Sync with dashboard
      await syncStockWithDashboard(newStock);
      
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      return Promise.reject(error);
    }
  };

  return {
    currentStock,
    loading,
    fetchCurrentStock,
    handleStockUpdate
  };
}
