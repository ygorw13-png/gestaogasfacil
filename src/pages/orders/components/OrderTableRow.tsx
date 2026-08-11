
import React, { MouseEvent, memo } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Order } from "../types";
import { StatusBadge } from "./StatusBadge";
import { Clipboard, Check, X, Truck, PhoneCall } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { msgPedidoConfirmado, msgSaiuParaEntrega } from "@/utils/whatsappLinks";

interface OrderTableRowProps {
  order: Order;
  onAssign: (orderId: string) => void;
  onStartClick: (orderId: string) => void;
  onComplete: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onViewDetails: () => void;
}

function OrderTableRowComponent({
  order,
  onAssign,
  onStartClick,
  onComplete,
  onCancel,
  onViewDetails,
}: OrderTableRowProps) {
  const getTimeAgo = (date: Date): string => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const handleCallClient = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation(); // Prevent any navigation
    if (order.clientPhone) {
      window.open(`tel:${order.clientPhone}`, '_blank');
    }
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
        <div className="font-medium">
          {order.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
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
      <TableCell><StatusBadge status={order.status} /></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {order.status === "pending" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssign(order.id)}
              >
                <Clipboard size={14} className="mr-1" /> Atribuir
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCancel(order.id)}
              >
                <X size={14} />
              </Button>
            </>
          )}
          {order.status === "assigned" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartClick(order.id)}
            >
              <Truck size={14} className="mr-1" /> Iniciado
            </Button>
          )}
          {order.status === "delivering" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComplete(order.id)}
            >
              <Check size={14} className="mr-1" /> Concluir
            </Button>
          )}
          <WhatsAppButton
            phone={order.clientPhone}
            iconOnly
            message={
              order.status === "delivering" || order.status === "assigned"
                ? msgSaiuParaEntrega(order, order.deliveryPersonName)
                : msgPedidoConfirmado(order)
            }
            variant="ghost"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCallClient}
            title="Ligar para cliente"
          >
            <PhoneCall size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onViewDetails}
            title="Ver detalhes"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22384 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const OrderTableRow = memo(OrderTableRowComponent);
