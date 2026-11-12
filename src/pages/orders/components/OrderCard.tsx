import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Clipboard, Info, MoreVertical, PhoneCall, Printer, Repeat, ShieldAlert, X } from "lucide-react";
import { Order } from "../types";
import { EstadoEntregaBadge } from "./EstadoEntregaBadge";
import { acoesEntrega, entregaAberta, motivoRevisao, numeroPedido } from "@/lib/entregas";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { msgPedidoConfirmado, msgSaiuParaEntrega } from "@/utils/whatsappLinks";
import { printReceipt } from "@/lib/receiptPrint";
import { readPrinterSettings } from "@/hooks/usePrinterSettings";
import { formatCurrency } from "@/lib/formatUtils";

interface OrderCardProps {
  order: Order;
  onAssign: (orderId: string) => void;
  onReassign: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onRegularize: (orderId: string) => void;
  onViewDetails: () => void;
  isAdmin: boolean;
  hoje: string;
}

/** Pedido em cartão para telas estreitas: dados essenciais, a próxima ação em destaque e o resto num menu. */
function OrderCardComponent({ order, onAssign, onReassign, onComplete, onCancel, onRegularize, onViewDetails, isAdmin, hoje }: OrderCardProps) {
  const acoes = acoesEntrega(order, isAdmin);
  const revisao = motivoRevisao(order);
  const aberta = entregaAberta(order.status);
  const atrasada = !!order.dataEntrega && order.dataEntrega < hoje && aberta;
  const agendada = !!order.dataEntrega && order.dataEntrega > hoje;
  const dataBR = (d: string) => d.split("-").reverse().join("/");
  const criado = `${order.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Bahia", day: "2-digit", month: "2-digit" })} ${order.createdAt.toLocaleTimeString("pt-BR", { timeZone: "America/Bahia", hour: "2-digit", minute: "2-digit" })}`;

  // Próxima ação válida: concluir > atribuir > regularizar. Reatribuir fica no menu.
  const principal = acoes.concluir
    ? { rotulo: "Concluir entrega", icone: <Check />, fn: () => onComplete(order.id), variante: "default" as const }
    : acoes.atribuir
    ? { rotulo: "Atribuir", icone: <Clipboard />, fn: () => onAssign(order.id), variante: "default" as const }
    : acoes.regularizar
    ? { rotulo: "Regularizar", icone: <ShieldAlert />, fn: () => onRegularize(order.id), variante: "outline" as const }
    : null;

  return (
    <article className={`rounded-lg border bg-card p-3 ${atrasada ? "border-destructive/50" : ""}`} aria-label={`Pedido ${numeroPedido(order.id)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button type="button" onClick={onViewDetails} className="-ml-1 min-h-11 px-1 font-mono text-sm font-semibold text-primary">
            {numeroPedido(order.id)}
          </button>
          <div className="truncate font-medium">{order.clientName}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold">{formatCurrency(Number(order.price ?? 0))}</div>
          <div className="text-xs text-muted-foreground">{criado}</div>
        </div>
      </div>

      <div className="mt-1 text-sm">{order.quantity}× {order.product}</div>
      {(atrasada || agendada || order.entregaPrevista) && order.dataEntrega && (
        <div className={`text-xs font-medium ${atrasada ? "text-destructive" : "text-muted-foreground"}`}>
          {atrasada ? "Atrasada · " : agendada ? "Agendada · " : "Prevista · "}entrega {dataBR(order.dataEntrega)}
        </div>
      )}
      {(order.address.street || order.address.neighborhood) && (
        <div className="truncate text-xs text-muted-foreground">
          {[order.address.street && `${order.address.street}, ${order.address.number}`, order.address.neighborhood].filter(Boolean).join(" · ")}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <EstadoEntregaBadge entrega={order} />
        {order.deliveryPersonName && <span className="text-xs text-muted-foreground">{order.deliveryPersonName}</span>}
      </div>
      {revisao && <div className="mt-1 text-xs text-destructive">{revisao}</div>}
      {order.status === "pending" && order.rejectionReason && <div className="mt-1 text-xs text-muted-foreground">Recusa: {order.rejectionReason}</div>}

      <div className="mt-3 flex items-center gap-2">
        {principal ? (
          <Button className="h-11 flex-1" variant={principal.variante} onClick={principal.fn}>
            {principal.icone} {principal.rotulo}
          </Button>
        ) : (
          <Button className="h-11 flex-1" variant="outline" onClick={onViewDetails}><Info /> Ver detalhes</Button>
        )}
        <WhatsAppButton
          phone={order.clientPhone}
          iconOnly
          className="h-11 w-11"
          message={order.status === "delivering" || order.status === "assigned" ? msgSaiuParaEntrega(order, order.deliveryPersonName) : msgPedidoConfirmado(order)}
          variant="outline"
          aria-label="Enviar no WhatsApp"
        />
        <MaisAcoesPedido order={order} onReassign={acoes.reatribuir ? () => onReassign(order.id) : undefined}
          onViewDetails={onViewDetails} onCancel={() => onCancel(order.id)} />
      </div>
    </article>
  );
}

export const OrderCard = memo(OrderCardComponent);

/** Ações secundárias do pedido num menu (celular e computador). */
export function MaisAcoesPedido({ order, onReassign, onViewDetails, onCancel }: {
  order: Order; onReassign?: () => void; onViewDetails: () => void; onCancel: () => void;
}) {
  const imprimir = readPrinterSettings().enabled;
  const aberta = entregaAberta(order.status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 md:h-9 md:w-9" aria-label="Mais ações" title="Mais ações">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {onReassign && (
          <DropdownMenuItem className="min-h-11" onSelect={onReassign}><Repeat className="mr-2 h-4 w-4" /> Reatribuir</DropdownMenuItem>
        )}
        <DropdownMenuItem className="min-h-11" onSelect={onViewDetails}><Info className="mr-2 h-4 w-4" /> Ver detalhes</DropdownMenuItem>
        {order.clientPhone && (
          <DropdownMenuItem className="min-h-11" onSelect={() => window.open(`tel:${order.clientPhone}`, "_blank")}>
            <PhoneCall className="mr-2 h-4 w-4" /> Ligar para o cliente
          </DropdownMenuItem>
        )}
        {imprimir && (
          <DropdownMenuItem className="min-h-11" onSelect={() => printReceipt({
            id: order.id, clientName: order.clientName, clientPhone: order.clientPhone, address: order.address,
            product: order.product, quantity: order.quantity, price: order.price, paymentMethod: order.paymentMethod,
            notes: order.notes, createdAt: order.createdAt,
          })}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir cupom
          </DropdownMenuItem>
        )}
        {aberta && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11 text-destructive" onSelect={onCancel}><X className="mr-2 h-4 w-4" /> Cancelar pedido</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
