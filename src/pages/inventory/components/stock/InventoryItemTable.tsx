
import InventoryTable from "../../InventoryTable";
import { StockData, MinStockLevels } from "./StockData";
import { InventoryItem } from "../../InventoryTable";

interface InventoryItemTableProps {
  currentStock: StockData;
  minStock: MinStockLevels;
}

export function InventoryItemTable({ currentStock, minStock }: InventoryItemTableProps) {
  // Prepare inventory table data
  const inventoryData: InventoryItem[] = [
    { 
      id: 1, 
      product: "GLP P13", 
      stock: currentStock.p13, 
      category: "GLP", 
      min_stock: minStock.p13,
      status: currentStock.p13 >= minStock.p13 ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.p13,
      type: "GLP",
      lastUpdate: new Date().toISOString()
    },
    { 
      id: 2, 
      product: "GLP P20", 
      stock: currentStock.p20, 
      category: "GLP", 
      min_stock: minStock.p20,
      status: currentStock.p20 >= minStock.p20 ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.p20,
      type: "GLP",
      lastUpdate: new Date().toISOString()
    },
    { 
      id: 3, 
      product: "GLP P45", 
      stock: currentStock.p45, 
      category: "GLP", 
      min_stock: minStock.p45,
      status: currentStock.p45 >= minStock.p45 ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.p45,
      type: "GLP",
      lastUpdate: new Date().toISOString()
    },
    { 
      id: 4, 
      product: "Água 20L", 
      stock: currentStock.water, 
      category: "Água", 
      min_stock: minStock.water,
      status: currentStock.water >= minStock.water ? "Disponível" : "Estoque Baixo",
      location: "Estoque",
      quantity: currentStock.water,
      type: "Água",
      lastUpdate: new Date().toISOString()
    }
  ];

  return <InventoryTable data={inventoryData} filterText="" />;
}
