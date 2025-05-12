
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: string;
  product: string;
  category: string;
  quantity: number;
  last_update: string;
  updated_by: string;
}

export interface InventoryMovement {
  id?: string;
  product: string;
  type: 'entrada' | 'saída' | 'ajuste';
  quantity: number;
  previous_quantity?: number;
  new_quantity?: number;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para buscar itens do inventário
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: stockData } = await supabase
        .from('dashboard_data')
        .select('stock_data')
        .maybeSingle();

      if (stockData?.stock_data) {
        const stocks = [
          {
            id: 'p13',
            product: 'GLP P13',
            category: 'GLP',
            quantity: stockData.stock_data.p13 || 0,
            last_update: new Date().toISOString(),
            updated_by: 'sistema'
          },
          {
            id: 'p20',
            product: 'GLP P20',
            category: 'GLP',
            quantity: stockData.stock_data.p20 || 0,
            last_update: new Date().toISOString(),
            updated_by: 'sistema'
          },
          {
            id: 'p45',
            product: 'GLP P45',
            category: 'GLP',
            quantity: stockData.stock_data.p45 || 0,
            last_update: new Date().toISOString(),
            updated_by: 'sistema'
          },
          {
            id: 'water',
            product: 'Água 20L',
            category: 'Água',
            quantity: stockData.stock_data.water || 0,
            last_update: new Date().toISOString(),
            updated_by: 'sistema'
          }
        ];
        
        setItems(stocks);
      }
    } catch (error) {
      console.error("Erro ao buscar inventário:", error);
      setError("Não foi possível carregar os dados do inventário");
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para buscar movimentações de estoque
  const fetchMovements = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('requisicoes_estoque')
        .select('*')
        .order('data_solicitacao', { ascending: false });

      if (data) {
        // Transformar requisições em movimentos
        const transformedMovements: InventoryMovement[] = data.flatMap(req => {
          if (!req.itens) return [];

          const items = Array.isArray(req.itens) ? req.itens : [req.itens];
          return items.map((item: any) => ({
            id: `${req.id}-${item.produto}`,
            product: item.produto,
            type: req.origem === 'estoque' ? 'saída' : 'entrada',
            quantity: item.quantidade || 0,
            notes: req.observacoes || '',
            created_at: req.data_solicitacao,
            created_by: req.solicitante_id
          }));
        });

        setMovements(transformedMovements);
      }
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
    }
  }, []);

  // Função para registrar movimento de estoque
  const registerMovement = useCallback(async (movement: InventoryMovement) => {
    try {
      const { product, type, quantity, notes } = movement;
      
      // Buscar estoque atual
      const { data: stockData } = await supabase
        .from('dashboard_data')
        .select('id, stock_data')
        .maybeSingle();
        
      if (!stockData || !stockData.stock_data) {
        throw new Error("Não foi possível encontrar os dados de estoque");
      }
      
      const productKey = product.includes('P13') ? 'p13' : 
                         product.includes('P20') ? 'p20' : 
                         product.includes('P45') ? 'p45' : 'water';
      
      const currentQuantity = stockData.stock_data[productKey] || 0;
      
      // Calcular nova quantidade
      let newQuantity = currentQuantity;
      if (type === 'entrada') {
        newQuantity += quantity;
      } else if (type === 'saída') {
        if (currentQuantity < quantity) {
          throw new Error(`Estoque insuficiente de ${product}`);
        }
        newQuantity -= quantity;
      } else {
        // Ajuste
        newQuantity = quantity;
      }
      
      // Atualizar estoque
      const newStockData = { ...stockData.stock_data, [productKey]: newQuantity };
      
      const { error: updateError } = await supabase
        .from('dashboard_data')
        .update({ stock_data: newStockData })
        .eq('id', stockData.id);
      
      if (updateError) throw updateError;
      
      // Registrar movimentação
      const { error: reqError } = await supabase
        .from('requisicoes_estoque')
        .insert({
          solicitante_id: movement.created_by || 'sistema',
          status: 'aprovada',
          data_solicitacao: new Date().toISOString(),
          data_processamento: new Date().toISOString(),
          processado_por: movement.created_by || 'sistema',
          itens: [{ produto: product, quantidade: quantity }],
          observacoes: notes,
          origem: type === 'entrada' ? 'portaria' : 'estoque',
          destino: type === 'entrada' ? 'estoque' : 'portaria'
        });
      
      if (reqError) throw reqError;
      
      // Atualizar dados locais
      await fetchInventory();
      await fetchMovements();
      
      toast({
        title: "Movimentação registrada",
        description: `${quantity} unidades de ${product} (${type})`
      });
      
      return true;
    } catch (error: any) {
      console.error("Erro ao registrar movimentação:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a movimentação",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchInventory, fetchMovements, toast]);

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchInventory();
    fetchMovements();
  }, [fetchInventory, fetchMovements]);

  return {
    items,
    movements,
    loading,
    error,
    fetchInventory,
    fetchMovements,
    registerMovement
  };
}
