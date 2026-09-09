import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Package, DollarSign, CreditCard, Navigation, Check, X, Bell, BellOff, Clock, Bike } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyDeliveries, useAcceptDelivery, useRejectDelivery, useConfirmDelivery, type DeliveryOrder } from "@/hooks/useMyDeliveries";
import { useTrackMyLocation } from "@/hooks/useEntregadorLocation";
import { useUserRole } from "@/hooks/useUserRole";
import { formatAddress, mapsRouteUrl, hasMapAddress } from "@/utils/mapsLinks";
import { tipoVendaShort } from "@/lib/saleTypes";
import { playDeliveryAlert } from "@/utils/deliveryAlert";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";


const minutesSince = (iso?: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 60000) : 0;

function DeliveryCard({ order }: { order: DeliveryOrder }) {
  const accept = useAcceptDelivery();
  const reject = useRejectDelivery();
  const confirm = useConfirmDelivery();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [recebeuVasilhame, setRecebeuVasilhame] = useState((order as any).tipo_venda !== "completa");
  const [vasilhamesRecebidos, setVasilhamesRecebidos] = useState(order.quantity ?? 1);

  const isPending = order.status === "pending" || order.status === "assigned";
  const isInProgress = order.status === "in-progress";
  const isDone = order.status === "completed";

  const espera = minutesSince(isPending ? order.created_at : order.accepted_at);
  const atrasado = !isDone && espera >= 10;

  return (
    <Card className={atrasado ? "border-destructive border-2" : isPending ? "border-primary border-2 shadow-lg" : ""}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate">{order.client_name}</CardTitle>
            {order.client_phone && (
              <a href={`tel:${order.client_phone}`} className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" /> {order.client_phone}
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={isDone ? "secondary" : isInProgress ? "default" : "destructive"}>
              {isDone ? "Entregue" : isInProgress ? "Em rota" : "Nova"}
            </Badge>
            {!isDone && (
              <span className={`text-xs flex items-center gap-1 ${atrasado ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                <Clock className="h-3 w-3" /> {espera} min
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <span>{formatAddress(order.address) || "Endereço não informado"}</span>
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
          <div className="col-span-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{tipoVendaShort((order as any).tipo_venda)}</Badge>
            {order.payment_method && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <CreditCard className="h-4 w-4" /> {order.payment_method}
              </span>
            )}
          </div>
        </div>

        {order.notes && (
          <div className="bg-muted p-2 rounded text-sm"><strong>Obs:</strong> {order.notes}</div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          {hasMapAddress(order.address) ? (
            <Button size="lg" variant="outline" className="h-12" asChild>
              <a href={mapsRouteUrl(order.address)} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4 mr-1" /> Ver rota
              </a>
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="h-12" disabled>
              <Navigation className="h-4 w-4 mr-1" /> Sem endereço
            </Button>
          )}

          {isPending && (
            <>
              <Button size="lg" className="h-12" onClick={() => accept.mutate(order.id)} disabled={accept.isPending}>
                <Check className="h-4 w-4 mr-1" /> Aceitar
              </Button>
              <Button size="sm" variant="ghost" className="col-span-2 text-destructive" onClick={() => setRejectOpen(true)}>
                <X className="h-4 w-4 mr-1" /> Recusar entrega
              </Button>
            </>
          )}

          {isInProgress && (
            <Button size="lg" className="h-12 bg-green-600 hover:bg-green-700" onClick={() => setConfirmOpen(true)}>
              <Check className="h-4 w-4 mr-1" /> Entreguei
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recusar entrega</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da recusa" value={reason} onChange={(e) => setReason(e.target.value)} />
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
              <span className="text-sm">Recebi vasilhame vazio na troca</span>
            </label>
            {recebeuVasilhame && (
              <div className="space-y-2">
                <Label>Quantos vasilhames vazios voltaram?</Label>
                <Input
                  type="number"
                  min={0}
                  value={vasilhamesRecebidos}
                  onChange={(e) => setVasilhamesRecebidos(Math.max(0, +e.target.value))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              await confirm.mutateAsync({
                orderId: order.id,
                recebeuVasilhame,
                vasilhamesRecebidos: recebeuVasilhame ? vasilhamesRecebidos : 0,
              });
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
  const { name, isEntregador } = useUserRole();
  const { toast } = useToast();
  const push = usePushNotifications();
  const lastReminder = useRef(0);


  // Atualiza a localização no mapa de entregas sempre que acessa o app
  useTrackMyLocation(isEntregador, name);

  const pendentes = orders.filter((o) => o.status === "pending" || o.status === "assigned");
  const emRota = orders.filter((o) => o.status === "in-progress");
  const concluidas = orders.filter((o) => o.status === "completed");

  const totalHoje = concluidas.reduce((s, o) => s + Number(o.price ?? 0), 0);
  const vasilhamesPendentes = concluidas.reduce(
    (s, o) => s + Number((o as any).vasilhames_recebidos ?? 0),
    0
  );

  // Relembra a cada 2 min se houver entrega parada há mais de 5/10 minutos
  useEffect(() => {
    const timer = setInterval(() => {
      // Não aceitou em 5 minutos: alerta sem parar, a cada 20 segundos
      const naoAceitas = pendentes.filter((o) => minutesSince(o.created_at) >= 5);
      const paradas = emRota.filter((o) => minutesSince(o.accepted_at) >= 15);
      const insistente = naoAceitas.length > 0;
      const intervalo = insistente ? 20000 : 120000;
      const atrasadas = [...naoAceitas, ...paradas];

      if (atrasadas.length && Date.now() - lastReminder.current > intervalo) {
        lastReminder.current = Date.now();
        playDeliveryAlert();
        toast({
          title: insistente ? "🚨 Aceite a entrega!" : "⏰ Entrega pendente",
          description: `${atrasadas.length} entrega(s) aguardando sua ação.`,
          variant: "destructive",
        });
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(insistente ? "Aceite a entrega!" : "Entrega pendente", {
            body: `${atrasadas.length} entrega(s) aguardando você.`,
            tag: "entrega-pendente",
            renotify: true,
            requireInteraction: true,
          } as NotificationOptions);
        }
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [pendentes, emRota, toast]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl font-bold">Minhas Entregas</h1>
        <Button
          variant={push.subscribed ? "secondary" : "default"}
          size="sm"
          disabled={push.loading || !push.supported}
          onClick={() => (push.subscribed ? push.unsubscribe() : push.subscribe())}
        >
          {push.subscribed ? <BellOff className="h-4 w-4 mr-1" /> : <Bell className="h-4 w-4 mr-1" />}
          {push.subscribed ? "Alertas ativos" : "Ativar alertas"}
        </Button>
      </div>


      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Entregues hoje</p>
          <p className="text-xl font-bold">{concluidas.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">A acertar</p>
          <p className="text-xl font-bold">R$ {totalHoje.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Vazios na moto</p>
          <p className="text-xl font-bold">{vasilhamesPendentes}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pendentes">
            Novas {pendentes.length > 0 && <Badge variant="destructive" className="ml-2">{pendentes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="rota">Em rota {emRota.length > 0 && <Badge className="ml-2">{emRota.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="feitas">Entregues</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-3 mt-4">
          {isLoading ? <p className="text-center text-muted-foreground py-8">Carregando...</p> :
            pendentes.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma entrega nova</p> :
            pendentes.map((o) => <DeliveryCard key={o.id} order={o} />)}
        </TabsContent>

        <TabsContent value="rota" className="space-y-3 mt-4">
          {emRota.length === 0 ? <p className="text-center text-muted-foreground py-8">Sem entregas em rota</p> :
            emRota.map((o) => <DeliveryCard key={o.id} order={o} />)}
        </TabsContent>

        <TabsContent value="feitas" className="space-y-3 mt-4">
          {concluidas.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma entrega concluída</p> :
            concluidas.map((o) => <DeliveryCard key={o.id} order={o} />)}
        </TabsContent>
      </Tabs>

      <Button
        asChild
        size="lg"
        className="fixed bottom-24 right-4 z-40 h-14 rounded-full px-5 shadow-lg"
      >
        <Link to="/entregador/venda-rua" aria-label="Nova venda na rua">
          <Bike className="mr-2 h-5 w-5" /> Nova venda
        </Link>
      </Button>
    </div>
  );
}
