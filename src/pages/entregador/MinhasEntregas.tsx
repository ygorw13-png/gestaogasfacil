import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Package, DollarSign, CreditCard, Navigation, Check, X, Bell } from "lucide-react";
import { useMyDeliveries, useAcceptDelivery, useRejectDelivery, useConfirmDelivery, type DeliveryOrder } from "@/hooks/useMyDeliveries";

function formatAddress(addr: any): string {
  if (!addr) return "Endereço não informado";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.number, addr.neighborhood, addr.city].filter(Boolean);
  return parts.join(", ") || "Endereço não informado";
}

function openInMaps(addr: any) {
  const q = encodeURIComponent(formatAddress(addr));
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
}

function DeliveryCard({ order }: { order: DeliveryOrder }) {
  const accept = useAcceptDelivery();
  const reject = useRejectDelivery();
  const confirm = useConfirmDelivery();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [recebeuVasilhame, setRecebeuVasilhame] = useState(false);

  const isPending = order.status === "pending" || order.status === "assigned";
  const isInProgress = order.status === "in-progress";
  const isDone = order.status === "completed";

  return (
    <Card className={isPending ? "border-primary border-2 shadow-lg animate-pulse" : ""}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.client_name}</CardTitle>
            {order.client_phone && (
              <a href={`tel:${order.client_phone}`} className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" /> {order.client_phone}
              </a>
            )}
          </div>
          <Badge variant={isDone ? "secondary" : isInProgress ? "default" : "destructive"}>
            {isDone ? "Entregue" : isInProgress ? "Em rota" : "Nova"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <span>{formatAddress(order.address)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{order.product ?? "-"} ({order.quantity ?? 1})</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">R$ {Number(order.price ?? 0).toFixed(2)}</span>
          </div>
          {order.payment_method && (
            <div className="flex items-center gap-2 col-span-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>{order.payment_method}</span>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="bg-muted p-2 rounded text-sm">
            <strong>Obs:</strong> {order.notes}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => openInMaps(order.address)}>
            <Navigation className="h-4 w-4 mr-1" /> Maps
          </Button>

          {isPending && (
            <>
              <Button size="sm" onClick={() => accept.mutate(order.id)} disabled={accept.isPending}>
                <Check className="h-4 w-4 mr-1" /> Aceitar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
                <X className="h-4 w-4 mr-1" /> Recusar
              </Button>
            </>
          )}

          {isInProgress && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmOpen(true)}>
              <Check className="h-4 w-4 mr-1" /> Confirmar Entrega
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recusar entrega</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da recusa" value={reason} onChange={e => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              await reject.mutateAsync({ orderId: order.id, reason });
              setRejectOpen(false);
            }}>Confirmar recusa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar entrega</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm">Confirme que o pedido foi entregue ao cliente.</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={recebeuVasilhame} onCheckedChange={(v) => setRecebeuVasilhame(!!v)} />
              <span className="text-sm">Recebeu vasilhame vazio na troca</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              await confirm.mutateAsync({ orderId: order.id, recebeuVasilhame });
              setConfirmOpen(false);
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function MinhasEntregas() {
  const { data: orders = [], isLoading } = useMyDeliveries();

  const pendentes = orders.filter(o => o.status === "pending" || o.status === "assigned");
  const emRota = orders.filter(o => o.status === "in-progress");
  const concluidas = orders.filter(o => o.status === "completed");

  // Pede permissão pra notificar
  const enableNotifications = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minhas Entregas</h1>
        <Button variant="outline" size="sm" onClick={enableNotifications}>
          <Bell className="h-4 w-4 mr-1" /> Ativar alertas
        </Button>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pendentes">
            Novas {pendentes.length > 0 && <Badge variant="destructive" className="ml-2">{pendentes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="rota">Em rota {emRota.length > 0 && <Badge className="ml-2">{emRota.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="feitas">Entregues hoje</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-3 mt-4">
          {isLoading ? <p className="text-center text-muted-foreground py-8">Carregando...</p> :
            pendentes.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma entrega nova</p> :
            pendentes.map(o => <DeliveryCard key={o.id} order={o} />)}
        </TabsContent>

        <TabsContent value="rota" className="space-y-3 mt-4">
          {emRota.length === 0 ? <p className="text-center text-muted-foreground py-8">Sem entregas em rota</p> :
            emRota.map(o => <DeliveryCard key={o.id} order={o} />)}
        </TabsContent>

        <TabsContent value="feitas" className="space-y-3 mt-4">
          {concluidas.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma entrega concluída</p> :
            concluidas.map(o => <DeliveryCard key={o.id} order={o} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
