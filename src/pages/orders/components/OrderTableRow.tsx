
import { memo } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Order } from "../types";
import { EstadoEntregaBadge } from "./EstadoEntregaBadge";
import { MaisAcoesPedido } from "./OrderCard";
import { Clipboard, Check, Repeat, ShieldAlert } from "lucide-react";
import { acoesEntrega, entregaAberta, motivoRevisao, numeroPedido } from "@/lib/entregas";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { msgPedidoConfirmado, msgSaiuParaEntrega } from "@/utils/whatsappLinks";

interface OrderTableRowProps {
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

function OrderTableRowComponent({
  order,
  onAssign,
  onReassign,
  onComplete,
  onCancel,
  onRegularize,
  onViewDetails,
  isAdmin,
  hoje,
}: OrderTableRowProps) {
  const acoes = acoesEntrega(order, isAdmin);
  const revisao = motivoRevisao(order);
  const atrasada = !!order.dataEntrega && order.dataEntrega < hoje && entregaAberta(order.status);
  const agendada = !!order.dataEntrega && order.dataEntrega > hoje;
  const dataBR = (d: string) => d.split("-").reverse().join("/");
  const getTimeAgo = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const elapsed = Date.now() - order.createdAt.getTime();
  const isPending = order.status === "pending";
  const isCritical = isPending && elapsed > 10 * 60 * 1000;
  const isLate = isPending && elapsed > 5 * 60 * 1000;

  return (
    <TableRow
      key={order.id}
      className={
        isCritical
          ? "bg-destructive/10 hover:bg-destructive/20"
          : isLate
          ? "bg-amber-500/10 hover:bg-amber-500/20"
          : "hover:bg-muted/50"
      }
    >
      <TableCell>
        <button type="button" onClick={onViewDetails} className="font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline" title="Abrir detalhes do pedido">
          {numeroPedido(order.id)}
        </button>
        <div className="font-medium">
          {order.createdAt.toLocaleDateString('pt-BR', { timeZone: 'America/Bahia', day: '2-digit', month: '2-digit' })}{" "}
          {order.createdAt.toLocaleTimeString('pt-BR', { timeZone: 'America/Bahia', hour: '2-digit', minute: '2-digit' })}
        </div>
        {(atrasada || agendada || order.entregaPrevista) && order.dataEntrega && (
          <div className={`text-xs font-medium ${atrasada ? "text-destructive" : "text-muted-foreground"}`}>
            {atrasada ? "Atrasada · " : agendada ? "Agendada · " : "Prevista · "}entrega {dataBR(order.dataEntrega)}
          </div>
        )}
        <div className={`text-xs ${isCritical ? "text-destructive font-medium" : isLate ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
          {getTimeAgo(order.createdAt)}
        </div>
      </TableCell>

      <TableCell>
        <div className="font-medium">{order.clientName}</div>
        <div className="text-xs text-muted-foreground">{order.clientPhone}</div>
      </TableCell>
      <TableCell>
        <div className="max-w-[200px] truncate">
          {order.address.street}, {order.address.number}
          {order.address.complement && `, ${order.address.complement}`}
        </div>
        <div className="text-xs text-muted-foreground">
          {order.address.neighborhood}
        </div>
      </TableCell>
      <TableCell>{order.product}</TableCell>
      <TableCell>{order.quantity}</TableCell>
      <TableCell>
        <EstadoEntregaBadge entrega={order} />
        {order.deliveryPersonName && <div className="mt-1 text-xs text-muted-foreground">{order.deliveryPersonName}</div>}
        {revisao && <div className="mt-1 max-w-[200px] text-xs text-destructive">{revisao}</div>}
        {order.status === "pending" && order.rejectionReason && <div className="mt-1 max-w-[200px] text-xs text-muted-foreground">Recusa: {order.rejectionReason}</div>}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-1">
          {acoes.atribuir && (
            <Button variant="outline" size="sm" onClick={() => onAssign(order.id)}>
              <Clipboard size={14} className="mr-1" /> Atribuir
            </Button>
          )}
          {acoes.reatribuir && (
            <Button variant="outline" size="sm" onClick={() => onReassign(order.id)}>
              <Repeat size={14} className="mr-1" /> Reatribuir
            </Button>
          )}
          {acoes.concluir && (
            <Button size="sm" onClick={() => onComplete(order.id)}>
              <Check size={14} className="mr-1" /> Concluir entrega
            </Button>
          )}
          {acoes.regularizar && (
            <Button variant="outline" size="sm" onClick={() => onRegularize(order.id)}>
              <ShieldAlert size={14} className="mr-1" /> Regularizar
            </Button>
          )}
          <WhatsAppButton
            phone={order.clientPhone}
            iconOnly
            className="h-9 w-9"
            message={
              order.status === "delivering" || order.status === "assigned"
                ? msgSaiuParaEntrega(order, order.deliveryPersonName)
                : msgPedidoConfirmado(order)
            }
            variant="ghost"
          />
          <MaisAcoesPedido order={order} onViewDetails={onViewDetails} onCancel={() => onCancel(order.id)} />
        </div>
      </TableCell>
    </TableRow>
  );
}

export const OrderTableRow = memo(OrderTableRowComponent);
