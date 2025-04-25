
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Package, PlusCircle, Phone, Clock, Check, Truck, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NewOrderForm from "./NewOrderForm";
import OrdersList from "./OrdersList";
import OrdersMap from "./OrdersMap";

// Order status types
export type OrderStatus = "pending" | "assigned" | "delivering" | "delivered" | "cancelled";

// Order type definition
export type Order = {
  id: string;
  clientName: string;
  clientPhone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
  };
  product: string;
  quantity: number;
  price: number;
  hasEmptyCylinder: boolean;
  isCompletePackage: boolean;
  createdAt: Date;
  status: OrderStatus;
  deliveryPerson?: string;
  assignedAt?: Date;
  deliveredAt?: Date;
  paymentMethod?: string;
  notes?: string;
};

// Mock data for orders
const mockOrders: Order[] = [
  {
    id: "1",
    clientName: "Maria Oliveira",
    clientPhone: "(11) 98765-4321",
    address: {
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 45",
      neighborhood: "Centro",
    },
    product: "GLP P13",
    quantity: 1,
    price: 120.00,
    hasEmptyCylinder: true,
    isCompletePackage: false,
    createdAt: new Date(2025, 3, 25, 10, 15),
    status: "pending",
  },
  {
    id: "2",
    clientName: "João Silva",
    clientPhone: "(11) 91234-5678",
    address: {
      street: "Avenida Paulista",
      number: "1500",
      complement: "Bloco B",
      neighborhood: "Bela Vista",
    },
    product: "GLP P13",
    quantity: 2,
    price: 240.00,
    hasEmptyCylinder: true,
    isCompletePackage: false,
    createdAt: new Date(2025, 3, 25, 9, 30),
    status: "assigned",
    deliveryPerson: "Carlos",
    assignedAt: new Date(2025, 3, 25, 9, 45),
  },
  {
    id: "3",
    clientName: "Restaurante Sabor",
    clientPhone: "(11) 3333-4444",
    address: {
      street: "Rua Augusta",
      number: "890",
      neighborhood: "Consolação",
    },
    product: "GLP P45",
    quantity: 1,
    price: 360.00,
    hasEmptyCylinder: true,
    isCompletePackage: false,
    createdAt: new Date(2025, 3, 25, 8, 15),
    status: "delivering",
    deliveryPerson: "Pedro",
    assignedAt: new Date(2025, 3, 25, 8, 30),
  },
  {
    id: "4",
    clientName: "Ana Souza",
    clientPhone: "(11) 99876-5432",
    address: {
      street: "Rua Direita",
      number: "45",
      complement: "Casa",
      neighborhood: "Jardim Europa",
    },
    product: "Água 20L",
    quantity: 3,
    price: 36.00,
    hasEmptyCylinder: false,
    isCompletePackage: false,
    createdAt: new Date(2025, 3, 25, 11, 0),
    status: "delivered",
    deliveryPerson: "Carlos",
    assignedAt: new Date(2025, 3, 25, 11, 15),
    deliveredAt: new Date(2025, 3, 25, 11, 50),
    paymentMethod: "Dinheiro",
  },
];

export default function Orders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // Add a new order
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

  // Assign order to delivery person
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

  // Mark order as delivering
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

  // Complete an order
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

  // Cancel an order
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

  // Count orders by status
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const assignedOrders = orders.filter(order => order.status === "assigned" || order.status === "delivering").length;
  const completedOrders = orders.filter(order => order.status === "delivered").length;
  
  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h1>
        <div>
          <NewOrderForm
            isOpen={isNewOrderOpen}
            onOpenChange={setIsNewOrderOpen}
            onSubmit={handleAddOrder}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando atribuição
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Entrega</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Atribuídos ou em rota
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Hoje</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Entregas concluídas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              Todos os pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Package size={14} />
            <span>Lista</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Truck size={14} />
            <span>Mapa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <OrdersList 
            orders={orders} 
            onAssign={handleAssignOrder}
            onStartDelivery={handleStartDelivery} 
            onComplete={handleCompleteOrder}
            onCancel={handleCancelOrder}
          />
        </TabsContent>

        <TabsContent value="map">
          <OrdersMap orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
