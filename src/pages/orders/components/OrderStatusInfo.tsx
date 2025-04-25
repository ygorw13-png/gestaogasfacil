
import { Clock } from "lucide-react";
import { Order } from "../types";
import { StatusBadge } from "./StatusBadge";

interface OrderStatusInfoProps {
  order: Order;
  formatDate: (date: Date | undefined) => string;
}

export function OrderStatusInfo({ order, formatDate }: OrderStatusInfoProps) {
  return (
    <div className="border-t mt-4 pt-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Clock size={16} className="text-muted-foreground" /> 
        Status do Pedido
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span className="text-sm font-medium"><StatusBadge status={order.status} /></span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Criado em:</span>
          <span className="text-sm font-medium">{formatDate(order.createdAt)}</span>
        </div>
        {order.deliveryPerson && (
          <div className="grid grid-cols-2">
            <span className="text-sm text-muted-foreground">Entregador:</span>
            <span className="text-sm font-medium">{order.deliveryPerson}</span>
          </div>
        )}
        {order.assignedAt && (
          <div className="grid grid-cols-2">
            <span className="text-sm text-muted-foreground">Atribuído em:</span>
            <span className="text-sm font-medium">{formatDate(order.assignedAt)}</span>
          </div>
        )}
        {order.deliveredAt && (
          <div className="grid grid-cols-2">
            <span className="text-sm text-muted-foreground">Entregue em:</span>
            <span className="text-sm font-medium">{formatDate(order.deliveredAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
