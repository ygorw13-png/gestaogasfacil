
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NewOrderForm from "./NewOrderForm";
import { OrdersList } from "./OrdersList";
import OrdersMap from "./OrdersMap";
import OrderStats from "./components/OrderStats";
import PendingAlert from "./components/PendingAlert";
import QuickSaleDialog from "./components/QuickSaleDialog";
import { useOrders } from "./hooks/useOrders";

export default function Orders() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const {
    orders,
    loading,
    fetchOrders,
    handleAddOrder,
    handleAssignOrder,
    handleStartDelivery,
    handleCompleteOrder,
    handleCancelOrder,
  } = useOrders();

  const onNewOrderSubmit = (order: any) => {
    handleAddOrder(order);
    setIsNewOrderOpen(false);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsQuickSaleOpen(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Venda Rápida
          </Button>
          <Button onClick={() => setIsNewOrderOpen(true)} size="default">
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      <PendingAlert orders={orders} />

      <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
          </DialogHeader>
          <NewOrderForm onSubmit={onNewOrderSubmit} />
        </DialogContent>
      </Dialog>

      <QuickSaleDialog
        isOpen={isQuickSaleOpen}
        onOpenChange={setIsQuickSaleOpen}
        onSaved={fetchOrders}
      />

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
            loading={loading}
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
