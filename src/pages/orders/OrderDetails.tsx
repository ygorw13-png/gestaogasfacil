
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "./types";
import { StatusBadge } from "./components/StatusBadge";
import { OrderInfo } from "./components/OrderInfo";
import { OrderStatusInfo } from "./components/OrderStatusInfo";
import { ClientInfo } from "./components/ClientInfo";
import { getPaymentMethodName, getDeliveryType, formatDate } from "./utils/orderUtils";

interface OrderDetailsProps {
  orderId: string;
  orders: Order[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderDetails({ 
  orderId, 
  orders,
  isOpen,
  onOpenChange 
}: OrderDetailsProps) {
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return null;
  }

  const callClient = () => {
    window.open(`tel:${order.clientPhone}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pedido #{order.id}</span>
            <StatusBadge status={order.status} />
          </DialogTitle>
          <DialogDescription>
            Pedido realizado em {formatDate(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <OrderInfo 
              order={order} 
              getPaymentMethodName={getPaymentMethodName}
              getDeliveryType={getDeliveryType}
            />
            <OrderStatusInfo 
              order={order}
              formatDate={formatDate}
            />
          </div>

          <ClientInfo 
            order={order}
            onCallClient={callClient}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
