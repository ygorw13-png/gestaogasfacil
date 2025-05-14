
import { useState, useEffect, useCallback } from "react";
import { useTableCRUD } from "@/services/supabase/hooks/useTableCRUD";
import { toast } from "@/components/ui/use-toast";

// Define inventory item type
export interface InventoryItem {
  id: string;
  product: string;
  category: string;
  quantity: number;
  last_update: string;
  min_quantity?: number;
}

// Define movement type
export interface InventoryMovement {
  id?: string;
  product: string;
  type: string;
  quantity: number;
  notes?: string;
  created_at: string;
}

export function useInventoryData() {
  // Use our table CRUD hook for items
  const {
    data: items,
    loading: itemsLoading,
    error: itemsError,
    fetchData: fetchItems,
    addItem,
    updateItem
  } = useTableCRUD<InventoryItem>("configuracoes_estoque", {
    toastMessages: {
      fetchError: "Erro ao carregar dados do inventário",
      createSuccess: "Item adicionado com sucesso",
      updateSuccess: "Item atualizado com sucesso"
    }
  });

  // Use our table CRUD hook for movements
  const {
    data: movements,
    loading: movementsLoading,
    error: movementsError,
    fetchData: fetchMovements,
    addItem: addMovement
  } = useTableCRUD<InventoryMovement>("requisicoes_estoque", {
    toastMessages: {
      fetchError: "Erro ao carregar movimentações",
      createSuccess: "Movimentação registrada com sucesso"
    }
  });

  // Function to register a new stock movement
  const registerMovement = useCallback(async (movement: InventoryMovement): Promise<boolean> => {
    try {
      // Add the movement record
      const result = await addMovement(movement);
      
      if (!result) {
        return false;
      }
      
      // Update inventory quantity based on movement type
      const existingItem = items.find(item => item.product === movement.product);
      
      if (existingItem) {
        const quantityChange = movement.type === "entrada" 
          ? movement.quantity 
          : -movement.quantity;
        
        await updateItem(existingItem.id, {
          quantity: existingItem.quantity + quantityChange,
          last_update: new Date().toISOString()
        });
      } else {
        // If item doesn't exist yet and it's an "entrada", create it
        if (movement.type === "entrada") {
          await addItem({
            product: movement.product,
            category: "Geral", // Default category
            quantity: movement.quantity,
            last_update: new Date().toISOString()
          });
        } else {
          toast({
            title: "Erro na movimentação",
            description: "Não é possível retirar um item que não existe no estoque",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Refresh data
      await fetchItems();
      await fetchMovements();
      
      return true;
    } catch (error) {
      console.error("Error registering movement:", error);
      toast({
        title: "Erro na movimentação",
        description: "Não foi possível registrar a movimentação",
        variant: "destructive"
      });
      return false;
    }
  }, [items, addItem, updateItem, addMovement, fetchItems, fetchMovements]);

  // Load data on mount
  useEffect(() => {
    fetchItems();
    fetchMovements();
  }, [fetchItems, fetchMovements]);

  return {
    items,
    movements,
    loading: itemsLoading || movementsLoading,
    error: itemsError || movementsError,
    registerMovement,
    refreshItems: fetchItems,
    refreshMovements: fetchMovements
  };
}
