
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "./Orders";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, Check, X, Truck, PhoneCall,
  Clipboard, MapPin, Package, DollarSign 
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock size={12} /> Pendente</Badge>;
      case "assigned":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clipboard size={12} /> Atribuído</Badge>;
      case "delivering":
        return <Badge variant="default" className="bg-amber-500 flex items-center gap-1"><Truck size={12} /> Em entrega</Badge>;
      case "delivered":
        return <Badge variant="default" className="bg-green-600 flex items-center gap-1"><Check size={12} /> Entregue</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1"><X size={12} /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodName = (method: string | undefined) => {
    if (!method) return "Não informado";
    
    const methods: Record<string, string> = {
      cash: "Dinheiro",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      pix: "PIX",
      promissory: "Promissória",
      voucher: "Vale Gás",
    };
    
    return methods[method] || method;
  };

  // Get delivery type
  const getDeliveryType = () => {
    if (order.isCompletePackage) {
      return "Venda completa (gás + vasilhame)";
    } else if (order.hasEmptyCylinder) {
      return "Troca (cliente entrega vasilhame vazio)";
    } else {
      return "Empréstimo (cliente não tem vasilhame para trocar)";
    }
  };
  
  // Format date as DD/MM/YYYY HH:MM
  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString('pt-BR') + " " + 
           date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const callClient = () => {
    // In a real app, this would trigger a phone call
    window.open(`tel:${order.clientPhone}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pedido #{order.id}</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
          <DialogDescription>
            Pedido realizado em {formatDate(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <span className="text-sm font-medium">{getDeliveryType()}</span>
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

            <div className="border-t mt-4 pt-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" /> 
                Status do Pedido
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">{getStatusBadge(order.status)}</span>
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
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-muted-foreground" /> 
              Informações do Cliente
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="text-sm text-muted-foreground">Nome:</span>
                <span className="text-sm font-medium">{order.clientName}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm text-muted-foreground">Telefone:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{order.clientPhone}</span>
                  <Button 
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={callClient}
                  >
                    <PhoneCall size={14} />
                  </Button>
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">Endereço:</span>
                <span className="text-sm font-medium block mt-1">
                  {order.address.street}, {order.address.number}
                  {order.address.complement && `, ${order.address.complement}`}
                  {order.address.neighborhood && ` - ${order.address.neighborhood}`}
                </span>
              </div>
            </div>

            {/* Optional: Map for future implementation */}
            <div className="border rounded-md h-[180px] mt-4 flex items-center justify-center bg-muted">
              <div className="text-center text-sm text-muted-foreground">
                <MapPin size={24} className="mx-auto mb-2" />
                <p>Mapa de localização</p>
                <p>Implementação futura</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
