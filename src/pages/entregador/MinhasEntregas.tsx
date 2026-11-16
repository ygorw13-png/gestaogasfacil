import { ReverterVendaDialog } from "@/components/reversao/ReverterVendaDialog";
import { dataEntrega, numeroPedido } from "@/lib/entregas";
import { dataOperacional } from "@/lib/dataOperacional";
import { G1_ACOES } from "@/lib/g1/acoes";
import { nomeForma } from "@/lib/formasPagamento";
import { Undo2 } from "lucide-react";
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
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useMyDeliveries, useAcceptDelivery, useRejectDelivery, useConfirmDelivery, type DeliveryOrder } from "@/hooks/useMyDeliveries";
import { useTrackMyLocation } from "@/hooks/useEntregadorLocation";
import { useUserRole } from "@/hooks/useUserRole";
import { formatAddress, mapsRouteUrl, hasMapAddress } from "@/utils/mapsLinks";
import { tipoVendaShort, normalizarTipoVenda } from "@/lib/saleTypes";
import { playDeliveryAlert } from "@/utils/deliveryAlert";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications, mostrarAvisoLocal, ehIOS } from "@/hooks/usePushNotifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const minutesSince = (iso?: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 60000) : 0;

function DeliveryCard({ order, destaque = false }: { order: DeliveryOrder; destaque?: boolean }) {
  const accept = useAcceptDelivery();
  const reject = useRejectDelivery();
  const confirm = useConfirmDelivery();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reverterOpen, setReverterOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [recebeuVasilhame, setRecebeuVasilhame] = useState(normalizarTipoVenda((order as any).tipo_venda) !== "completa");
  const [vasilhamesRecebidos, setVasilhamesRecebidos] = useState(order.quantity ?? 1);

  const isPending = order.status === "pending" || order.status === "assigned";
  const isInProgress = order.status === "in-progress" || order.status === "delivering";
  const isDone = order.status === "completed";

  const espera = minutesSince(isPending ? order.created_at : order.accepted_at);
  const atrasado = !isDone && espera >= 10;

  return (
    <Card id={`pedido-${order.id}`} className={`${atrasado ? "border-destructive border-2" : isPending ? "border-primary border-2 shadow-lg" : ""} ${destaque ? "ring-4 ring-primary/40" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-muted-foreground">{numeroPedido(order.id)}</p>
            <CardTitle className="text-lg truncate">{order.client_name}</CardTitle>
            {!isDone && dataEntrega(order.entrega_prevista, order.created_at) < dataOperacional() && (
              <p className="text-xs font-semibold text-destructive">
                Atrasada · pedido de {dataEntrega(order.entrega_prevista, order.created_at).split("-").reverse().join("/")}
              </p>
            )}
            {order.client_phone && (
              <a href={`tel:${order.client_phone}`} className="text-sm text-muted-foreground flex min-h-11 items-center gap-1">
                <Phone className="h-3 w-3" /> {order.client_phone}
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={isDone ? "secondary" : isInProgress ? "default" : "destructive"}>
              {isDone ? "Entregue" : isInProgress ? "Aceita / em rota" : "Aguardando seu aceite"}
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
                <CreditCard className="h-4 w-4" /> {nomeForma(order.payment_method)}
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

          {isDone && G1_ACOES && (
            <Button size="sm" variant="ghost" className="col-span-2 text-muted-foreground" onClick={() => setReverterOpen(true)}>
              <Undo2 className="h-4 w-4 mr-1" /> Pedir devolução ou troca
            </Button>
          )}
        </div>
      </CardContent>

      <ReverterVendaDialog open={reverterOpen} onOpenChange={setReverterOpen} pedido={{
        id: order.id, client: order.client_name, product: order.product ?? "", quantity: order.quantity ?? 1,
        amount: Number(order.price ?? 0), status: order.status, tipoVenda: (order as any).tipo_venda ?? null,
      }} />

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
            <Button disabled={confirm.isPending} onClick={async () => {
              try {
                await confirm.mutateAsync({
                  orderId: order.id,
                  recebeuVasilhame,
                  vasilhamesRecebidos: recebeuVasilhame ? vasilhamesRecebidos : 0,
                });
                setConfirmOpen(false);
              } catch {
                /* erro já mostrado; a janela continua aberta para tentar de novo */
              }
            }}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function MinhasEntregas() {
  const { data: orders = [], isLoading, refetch } = useMyDeliveries();
  const { name, isEntregador, isLoading: carregandoPapel } = useUserRole();
  const { toast } = useToast();
  const push = usePushNotifications();
  const lastReminder = useRef(0);
  const [params] = useSearchParams();
  const pedidoAberto = params.get("pedido");
  const [aba, setAba] = useState("pendentes");


  // Atualiza a localização no mapa de entregas sempre que acessa o app
  useTrackMyLocation(isEntregador, name);

  const pendentes = orders.filter((o) => o.status === "pending" || o.status === "assigned");
  const emRota = orders.filter((o) => o.status === "in-progress" || o.status === "delivering");
  const concluidas = orders.filter((o) => o.status === "completed");

  const totalHoje = concluidas.reduce((s, o) => s + Number(o.price ?? 0), 0);
  const vasilhamesPendentes = concluidas.reduce(
    (s, o) => s + Number((o as any).vasilhames_recebidos ?? 0),
    0
  );

  // Aberto pelo toque na notificação: vai para a aba do pedido e rola até ele.
  useEffect(() => {
    if (!pedidoAberto || orders.length === 0) return;
    const o = orders.find((x) => x.id === pedidoAberto);
    if (!o) return;
    setAba(pendentes.includes(o) ? "pendentes" : emRota.includes(o) ? "rota" : "feitas");
    const t = setTimeout(() => document.getElementById(`pedido-${o.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoAberto, orders]);

  // O banco só devolve pedidos atualmente com este entregador (conta ativa, mesma empresa).
  const pedidoIndisponivel = !!pedidoAberto && !isLoading && !orders.some((o) => o.id === pedidoAberto);

  // Lembretes com o app aberto (mesmos tempos de antes): sem aceite em 5 min, a cada 20 s;
  // em rota há 15 min, a cada 2 min. Antes de avisar, confere no servidor se o pedido
  // continua aguardando aceite / em rota com este entregador (aceite ou reatribuição param o lembrete).
  useEffect(() => {
    const timer = setInterval(async () => {
      const espera = (o: DeliveryOrder) => minutesSince((o as any).assigned_at ?? o.created_at);
      const temNaoAceita = pendentes.some((o) => espera(o) >= 5);
      const temParada = emRota.some((o) => minutesSince(o.accepted_at) >= 15);
      if (!temNaoAceita && !temParada) return;
      const intervalo = temNaoAceita ? 20000 : 120000;
      if (Date.now() - lastReminder.current <= intervalo) return;
      lastReminder.current = Date.now();

      const atual = ((await refetch()).data ?? []) as DeliveryOrder[];
      const naoAceitas = atual.filter((o) => (o.status === "pending" || o.status === "assigned") && espera(o) >= 5);
      const paradas = atual.filter((o) => (o.status === "in-progress" || o.status === "delivering") && minutesSince(o.accepted_at) >= 15);
      const atrasadas = [...naoAceitas, ...paradas];
      if (!atrasadas.length) return;
      const insistente = naoAceitas.length > 0;

      playDeliveryAlert();
      toast({
        title: insistente ? "🚨 Aceite a entrega!" : "⏰ Entrega pendente",
        description: `${atrasadas.length} entrega(s) aguardando sua ação.`,
        variant: "destructive",
      });
      void mostrarAvisoLocal(
        insistente ? "Aceite a entrega!" : "Entrega pendente",
        `${atrasadas.length} entrega(s) aguardando você.`,
        "entrega-pendente",
        atrasadas[0] ? `/entregador/entregas?pedido=${atrasadas[0].id}` : "/entregador/entregas",
      );
    }, 10000);
    return () => clearInterval(timer);
  }, [pendentes, emRota, toast, refetch]);

  // Link do aviso aberto por quem não é entregador (admin/operador): abre o pedido na tela de Pedidos.
  if (pedidoAberto && !carregandoPapel && !isEntregador) {
    return <Navigate to={`/orders?pedido=${encodeURIComponent(pedidoAberto)}`} replace />;
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl font-bold">Minhas Entregas</h1>
      </div>

      <PainelAvisos push={push} />

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

      {pedidoIndisponivel && (
        <Alert variant="destructive">
          <AlertTitle>Pedido indisponível</AlertTitle>
          <AlertDescription>Este pedido não está mais com você (foi reatribuído, cancelado ou já encerrado).</AlertDescription>
        </Alert>
      )}

      <Tabs value={aba} onValueChange={setAba} className="w-full">
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
            pendentes.map((o) => <DeliveryCard key={o.id} order={o} destaque={o.id === pedidoAberto} />)}
        </TabsContent>

        <TabsContent value="rota" className="space-y-3 mt-4">
          {emRota.length === 0 ? <p className="text-center text-muted-foreground py-8">Sem entregas em rota</p> :
            emRota.map((o) => <DeliveryCard key={o.id} order={o} destaque={o.id === pedidoAberto} />)}
        </TabsContent>

        <TabsContent value="feitas" className="space-y-3 mt-4">
          {concluidas.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma entrega concluída</p> :
            concluidas.map((o) => <DeliveryCard key={o.id} order={o} destaque={o.id === pedidoAberto} />)}
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

/** Estado dos avisos neste aparelho, com o que fazer em cada caso. */
function PainelAvisos({ push }: { push: ReturnType<typeof usePushNotifications> }) {
  const { estado, loading } = push;
  if (estado === "ativo") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
        <Bell className="h-4 w-4 text-primary" aria-hidden />
        <p className="mr-auto text-sm">Notificações ativas neste aparelho.</p>
        <Button size="sm" variant="outline" className="min-h-11" disabled={loading} onClick={() => push.testar()}>Testar aviso</Button>
        <Button size="sm" variant="ghost" className="min-h-11" disabled={loading} onClick={() => push.unsubscribe()}>
          <BellOff className="mr-1 h-4 w-4" /> Desativar
        </Button>
      </div>
    );
  }
  if (estado === "negado") {
    return (
      <Alert variant="destructive">
        <BellOff className="h-4 w-4" />
        <AlertTitle>Notificações bloqueadas neste aparelho</AlertTitle>
        <AlertDescription>
          Você não vai receber aviso de entrega com o app fechado. No Chrome: toque no cadeado ao lado do endereço →
          Permissões → Notificações → Permitir. Depois volte aqui e toque em “Ativar notificações”.
        </AlertDescription>
      </Alert>
    );
  }
  if (estado === "ios_instalar" || estado === "sem_suporte") {
    return (
      <Alert>
        <BellOff className="h-4 w-4" />
        <AlertTitle>Avisos em segundo plano indisponíveis</AlertTitle>
        <AlertDescription>
          {estado === "ios_instalar"
            ? "No iPhone, instale o app (Compartilhar → Adicionar à Tela de Início) e abra pelo ícone para ativar as notificações."
            : "Este navegador não recebe avisos com o app fechado. Use o Chrome no Android."}{" "}
          Com o app aberto, o alerta sonoro continua funcionando.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert>
      <Bell className="h-4 w-4" />
      <AlertTitle>Receba aviso de nova entrega</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Ative para ser avisado mesmo com o app em segundo plano ou a tela bloqueada. Som e vibração seguem a
          configuração do celular: modo silencioso e “Não perturbe” podem calar o aviso.
          {ehIOS() ? "" : " No Android, deixe as notificações do Chrome com som."}
        </p>
        <Button size="sm" className="min-h-11" disabled={loading} onClick={() => push.subscribe()}>
          <Bell className="mr-1 h-4 w-4" /> Ativar notificações
        </Button>
      </AlertDescription>
    </Alert>
  );
}
