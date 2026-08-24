
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Package, Plus, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import SaveClientPrompt, { type PendingClient } from "./components/SaveClientPrompt";

export default function Orders() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [pendingClient, setPendingClient] = useState<PendingClient | null>(null);
  const {
    orders,
    loading,
    fetchOrders,
    handleAddOrder,
    handleAssignOrder,
    handleStartDelivery,
    handleCompleteOrder,
    handleCancelOrder,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    isToday,
    resetToToday,
  } = useOrders();


  const onNewOrderSubmit = async (order: any) => {
    await handleAddOrder(order);
    setIsNewOrderOpen(false);
    if (order?.clientName) {
      setPendingClient({
        name: order.clientName,
        phone: order.clientPhone || "",
        address: order.address || {},
      });
    }
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

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-[160px]"
          />
        </div>
        <Button variant="outline" size="sm" onClick={resetToToday} disabled={isToday}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Hoje
        </Button>
        <span className="text-xs text-muted-foreground">
          {isToday
            ? "Mostrando apenas os pedidos de hoje"
            : "Filtro de período ativo (dias anteriores)"}
        </span>
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

      <SaveClientPrompt pending={pendingClient} onClose={() => setPendingClient(null)} />

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
          <OrdersMap />
        </TabsContent>
      </Tabs>
    </div>
  );
}
