
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { mockOrders } from "../mockData";

export function useOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const handleAddOrder = (order: Order) => {
    const newOrder = {
      ...order,
      id: (orders.length + 1).toString(),
      createdAt: new Date(),
      status: "pending" as OrderStatus,
    };
    
    setOrders([newOrder, ...orders]);
    toast({
      title: "Pedido registrado",
      description: `Pedido para ${order.clientName} registrado com sucesso`,
    });
  };

  const handleAssignOrder = (orderId: string, deliveryPerson: string) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: "assigned",
            deliveryPerson,
            assignedAt: new Date(),
          };
        }
        return order;
      })
    );

    toast({
      title: "Pedido atribuído",
      description: `Pedido atribuído a ${deliveryPerson}`,
    });
  };

  const handleStartDelivery = (orderId: string) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: "delivering",
          };
        }
        return order;
      })
    );

    toast({
      title: "Entrega iniciada",
      description: "Entrega em andamento",
    });
  };

  const handleCompleteOrder = (orderId: string, paymentMethod: string) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: "delivered",
            deliveredAt: new Date(),
            paymentMethod,
          };
        }
        return order;
      })
    );

    toast({
      title: "Entrega concluída",
      description: "Pedido entregue com sucesso",
      variant: "default",
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: "cancelled",
          };
        }
        return order;
      })
    );

    toast({
      title: "Pedido cancelado",
      description: "Pedido cancelado com sucesso",
      variant: "destructive",
    });
  };

  return {
    orders,
    handleAddOrder,
    handleAssignOrder,
    handleStartDelivery,
    handleCompleteOrder,
    handleCancelOrder,
  };
}
