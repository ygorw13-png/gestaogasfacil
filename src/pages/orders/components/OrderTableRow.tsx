
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Order } from "../types";
import { StatusBadge } from "./StatusBadge";
import { Clipboard, Check, X, Truck, PhoneCall } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderTableRowProps {
  order: Order;
  onAssign: () => void;
  onStartDelivery: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onViewDetails: () => void;
}

export function OrderTableRow({
  order,
  onAssign,
  onStartDelivery,
  onComplete,
  onCancel,
  onViewDetails,
}: OrderTableRowProps) {
  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <TableRow key={order.id} className="hover:bg-muted/50">
      <TableCell>
        <div className="font-medium">
          {order.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xs text-muted-foreground">
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
                onClick={onAssign}
              >
                <Clipboard size={14} className="mr-1" /> Atribuir
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
              >
                <X size={14} />
              </Button>
            </>
          )}
          {order.status === "assigned" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartDelivery}
            >
              <Truck size={14} className="mr-1" /> Iniciado
            </Button>
          )}
          {order.status === "delivering" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onComplete}
            >
              <Check size={14} className="mr-1" /> Concluir
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onViewDetails}
          >
            <PhoneCall size={14} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
