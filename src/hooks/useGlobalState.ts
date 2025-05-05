
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Interface for system-wide state
interface GlobalState {
  currentStock: {
    p13: number;
    p20: number;
    p45: number;
    agua: number;
  };
  pendingOrders: number;
  activeDeliveries: number;
  stockAlerts: {
    hasLowStock: boolean;
    lowStockItems: string[];
  };
}

// Default stock values
const defaultStock = {
  p13: 0,
  p20: 0,
  p45: 0,
  agua: 0
};

export function useGlobalState() {
  const { toast } = useToast();
  const { user, organization } = useAuth();
  const [globalState, setGlobalState] = useState<GlobalState>({
    currentStock: defaultStock,
    pendingOrders: 0,
    activeDeliveries: 0,
    stockAlerts: {
      hasLowStock: false,
      lowStockItems: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial global state from database
  const fetchGlobalState = useCallback(async () => {
    if (!user || !organization?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch current stock levels
      const { data: stockData, error: stockError } = await supabase
        .from('dashboard_data')
        .select('stock_data')
        .eq('user_id', user.id)
        .single();
        
      if (stockError) throw stockError;
      
      // Fetch pending orders count
      const { count: pendingOrdersCount, error: pendingOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
        
      if (pendingOrdersError) throw pendingOrdersError;
      
      // Fetch active deliveries count
      const { count: activeDeliveriesCount, error: activeDeliveriesError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'delivering']);
        
      if (activeDeliveriesError) throw activeDeliveriesError;
      
      // Check for low stock alerts
      const { data: stockConfigData, error: stockConfigError } = await supabase
        .from('configuracoes_estoque')
        .select('*');
        
      if (stockConfigError) throw stockConfigError;
      
      // Process stock alert data
      const stockLevels = stockData?.stock_data ? 
        (typeof stockData.stock_data === 'object' ? 
          stockData.stock_data as { p13: number; p20: number; p45: number; agua: number; } : 
          defaultStock) : 
        defaultStock;
      
      const lowStockItems: string[] = [];
      
      stockConfigData?.forEach((config) => {
        const productType = config.produto as keyof typeof stockLevels;
        if (config.alerta_ativo && stockLevels[productType] < config.estoque_minimo) {
          lowStockItems.push(config.produto);
        }
      });
      
      // Update global state
      setGlobalState({
        currentStock: stockLevels,
        pendingOrders: pendingOrdersCount || 0,
        activeDeliveries: activeDeliveriesCount || 0,
        stockAlerts: {
          hasLowStock: lowStockItems.length > 0,
          lowStockItems
        }
      });
      
    } catch (err) {
      console.error("Erro ao carregar estado global:", err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar informações do sistema",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, organization?.id, toast]);

  // Set up realtime subscriptions for global state updates
  useEffect(() => {
    if (!user) return;
    
    fetchGlobalState();
    
    // Listen for changes in orders table
    const ordersChannel = supabase
      .channel('public-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchGlobalState();
        }
      )
      .subscribe();
      
    // Listen for changes in stock data
    const stockChannel = supabase
      .channel('public-dashboard_data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_data'
        },
        () => {
          fetchGlobalState();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(stockChannel);
    };
  }, [user, fetchGlobalState]);

  return {
    globalState,
    loading,
    error,
    refreshGlobalState: fetchGlobalState
  };
}
