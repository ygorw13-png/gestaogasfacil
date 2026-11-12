
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Truck, Zap } from "lucide-react";
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
import { printReceipt } from "@/lib/receiptPrint";
import { readPrinterSettings } from "@/hooks/usePrinterSettings";
import { EntregaDetalhesDialog } from "./components/EntregaDetalhesDialog";
import type { FiltroPedidos } from "./hooks/useOrders";

export default function Orders() {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [pendingClient, setPendingClient] = useState<PendingClient | null>(null);
  const {
    orders,
    loading,
    erro,
    fetchOrders,
    handleAddOrder,
    handleAssignOrder,
    handleCancelOrder,
    filtro,
    setFiltro,
    contagem,
    hoje,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
  } = useOrders();
  const abrirDetalhe = (id: string) => { setDetalhe(id); searchParams.set("pedido", id); setSearchParams(searchParams, { replace: true }); };
  const fecharDetalhe = (open: boolean) => { if (open) return; setDetalhe(null); searchParams.delete("pedido"); setSearchParams(searchParams, { replace: true }); };
  const cancelar = async (id: string) => { await handleCancelOrder(id); fetchOrders(); };
  const FILTROS: { v: FiltroPedidos; rotulo: string; n?: number }[] = [
    { v: "operacional", rotulo: "Hoje e atrasadas", n: contagem.hoje + contagem.atrasadas },
    { v: "hoje", rotulo: "Hoje", n: contagem.hoje },
    { v: "atrasadas", rotulo: "Atrasadas", n: contagem.atrasadas },
    { v: "agendadas", rotulo: "Agendadas", n: contagem.agendadas },
    { v: "periodo", rotulo: "Por período" },
  ];


  // Acesso direto a /orders/new (redirecionado para /orders?novo=1): abre o diálogo real de novo pedido.
  useEffect(() => {
    const p = searchParams.get("pedido");
    if (p) setDetalhe(p);
    const f = searchParams.get("filtro") as FiltroPedidos | null;
    if (f) {
      if (["operacional", "hoje", "atrasadas", "agendadas", "periodo"].includes(f)) setFiltro(f);
      searchParams.delete("filtro");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("novo") === "1") {
      setIsNewOrderOpen(true);
      searchParams.delete("novo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, setFiltro]);
  const onNewOrderSubmit = async (order: any) => {
    // Só confirma, fecha e imprime depois da gravação comprovada, com o ID real
    const saved = await handleAddOrder(order);
    if (!saved) return;
    setIsNewOrderOpen(false);
    const printer = readPrinterSettings();
    if (printer.enabled && printer.autoPrint) {
      printReceipt({
        id: saved.id,
        clientName: saved.clientName,
        clientPhone: saved.clientPhone,
        address: saved.address,
        product: saved.product,
        quantity: saved.quantity,
        price: saved.price,
        paymentMethod: saved.paymentMethod,
        notes: saved.notes,
        createdAt: saved.createdAt,
      });
    }
    if (saved.clientName) {
      setPendingClient({
        name: saved.clientName,
        phone: saved.clientPhone || "",
        address: saved.address || {},
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

      <div className="space-y-3 rounded-lg border bg-card p-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtro de entregas">
          {FILTROS.map((f) => (
            <Button key={f.v} role="tab" aria-selected={filtro === f.v} size="sm" variant={filtro === f.v ? "default" : "outline"} onClick={() => setFiltro(f.v)}>
              {f.rotulo}{f.n !== undefined ? ` (${f.n})` : ""}
            </Button>
          ))}
        </div>
        {filtro === "periodo" ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="pedidosDe">De</label>
              <Input id="pedidosDe" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-[160px]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="pedidosAte">Até</label>
              <Input id="pedidosAte" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-[160px]" />
            </div>
            <span className="text-xs text-muted-foreground">Histórico de entregas pela data de criação.</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Só entregas (balcão e retirada ficam na portaria). Datas pela previsão da entrega ou, sem previsão, pelo dia do pedido (horário da Bahia).
            Entregas abertas de dias anteriores continuam aqui até serem concluídas, reatribuídas ou canceladas.
          </p>
        )}
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
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

      <EntregaDetalhesDialog orderId={detalhe} onOpenChange={fecharDetalhe} />

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
            hoje={hoje}
            vazio={filtro === "atrasadas" ? "Nenhuma entrega atrasada em aberto." : filtro === "agendadas" ? "Nenhuma entrega agendada." : undefined}
            onAssignOrder={handleAssignOrder}
            onCancelOrder={cancelar}
            onViewDetails={abrirDetalhe}
            onRefresh={fetchOrders}
          />
        </TabsContent>

        <TabsContent value="map">
          <OrdersMap />
        </TabsContent>
      </Tabs>
    </div>
  );
}
