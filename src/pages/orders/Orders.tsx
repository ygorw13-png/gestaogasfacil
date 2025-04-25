
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck } from "lucide-react";
import NewOrderForm from "./NewOrderForm";
import { OrdersList } from "./OrdersList";
import OrdersMap from "./OrdersMap";
import OrderStats from "./components/OrderStats";
import { useOrders } from "./hooks/useOrders";

export default function Orders() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const {
    orders,
    handleAddOrder,
    handleAssignOrder,
    handleStartDelivery,
    handleCompleteOrder,
    handleCancelOrder,
  } = useOrders();

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

      <OrderStats orders={orders} />

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
            onAssignOrder={handleAssignOrder}
            onStartDelivery={handleStartDelivery} 
            onCompleteOrder={handleCompleteOrder}
            onCancelOrder={handleCancelOrder}
          />
        </TabsContent>

        <TabsContent value="map">
          <OrdersMap orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
