
import React, { createContext, useState, useContext, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { subscribeToTable } from "@/services/supabaseSDK";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Calculate unread notifications count
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Listen for stock alerts
  useEffect(() => {
    if (!user) return;

    // Mock function to add stock alert notification
    const handleStockAlert = (payload: any) => {
      if (payload.new && payload.new.alerta_ativo && payload.new.estoque_atual < payload.new.estoque_minimo) {
        const newNotification: Notification = {
          id: `stock-${Date.now()}`,
          title: "Alerta de Estoque",
          message: `O estoque de ${payload.new.produto} está abaixo do mínimo configurado.`,
          type: "warning",
          isRead: false,
          createdAt: new Date()
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: "destructive"
        });
      }
    };

    // Subscribe to new orders
    const handleNewOrder = (payload: any) => {
      if (payload.new && payload.eventType === 'INSERT') {
        const newNotification: Notification = {
          id: `order-${payload.new.id}`,
          title: "Novo Pedido",
          message: `Novo pedido registrado para ${payload.new.client_name}.`,
          type: "info",
          isRead: false,
          createdAt: new Date()
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        toast({
          title: newNotification.title,
          description: newNotification.message
        });
      }
    };

    // Set up subscriptions
    const unsubscribeStock = subscribeToTable('dashboard_data', handleStockAlert, {
      event: 'UPDATE'
    });
    
    const unsubscribeOrders = subscribeToTable('orders', handleNewOrder, {
      event: 'INSERT'
    });

    return () => {
      unsubscribeStock();
      unsubscribeOrders();
    };
  }, [user, toast]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(currentNotifications =>
      currentNotifications.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(currentNotifications =>
      currentNotifications.map(notification => ({
        ...notification,
        isRead: true
      }))
    );
  };

  // Dismiss a notification
  const dismissNotification = (id: string) => {
    setNotifications(currentNotifications =>
      currentNotifications.filter(notification => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        dismissNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
