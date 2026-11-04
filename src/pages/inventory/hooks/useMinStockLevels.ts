
import { useCallback, useState } from "react";
import { fetchData } from "@/services/supabase/crud";
import { findStockConfig, type StockConfigRow } from "@/lib/stockConfig";
import { MinStockLevels, defaultMinStockLevels } from "../components/stock/StockData";

export function useMinStockLevels() {
  const [minStock, setMinStock] = useState<MinStockLevels>(defaultMinStockLevels);

  // Function to fetch minimum stock levels
  const fetchMinStockLevels = useCallback(async () => {
    try {
      const response = await fetchData('configuracoes_estoque');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data && response.data.length > 0) {
        const rows = response.data as StockConfigRow[];
        const p13Config = findStockConfig(rows, 'p13');
        const p20Config = findStockConfig(rows, 'p20');
        const p45Config = findStockConfig(rows, 'p45');
        const aguaConfig = findStockConfig(rows, 'agua');
        
        setMinStock({
          // ?? preserva zero configurado; o padrão só vale quando não há registro
          p13: p13Config?.estoque_minimo ?? 20,
          p20: p20Config?.estoque_minimo ?? 5,
          p45: p45Config?.estoque_minimo ?? 5,
          water: aguaConfig?.estoque_minimo ?? 20
        });
      }
    } catch (error) {
      console.error("Erro ao buscar níveis mínimos de estoque:", error);
    }
  }, []);

  return {
    minStock,
    fetchMinStockLevels
  };
}
