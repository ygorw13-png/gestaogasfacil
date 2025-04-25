
import { Package } from "lucide-react";
import { Order } from "../types";

interface OrderInfoProps {
  order: Order;
  getPaymentMethodName: (method: string | undefined) => string;
  getDeliveryType: (order: Order) => string;
}

export function OrderInfo({ order, getPaymentMethodName, getDeliveryType }: OrderInfoProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Package size={16} className="text-muted-foreground" /> 
        Informações do Pedido
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Produto:</span>
          <span className="text-sm font-medium">{order.product}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Quantidade:</span>
          <span className="text-sm font-medium">{order.quantity}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <span className="text-sm font-medium">{getDeliveryType(order)}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Valor Total:</span>
          <span className="text-sm font-medium">R$ {order.price.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-muted-foreground">Pagamento:</span>
          <span className="text-sm font-medium">{getPaymentMethodName(order.paymentMethod)}</span>
        </div>
        {order.notes && (
          <div className="col-span-2 mt-2">
            <span className="text-sm text-muted-foreground block">Observações:</span>
            <span className="text-sm block mt-1 p-2 bg-muted rounded">{order.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
