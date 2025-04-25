
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "./Orders";
import { 
  Check, X, Truck, Clock, PhoneCall, 
  Clipboard, AlertCircle, CheckCircle 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderDetails from "./OrderDetails";

// Mock delivery staff
const deliveryStaff = [
  { id: "1", name: "Carlos" },
  { id: "2", name: "Pedro" },
  { id: "3", name: "André" },
  { id: "4", name: "Paulo" },
];

interface OrdersListProps {
  orders: Order[];
  onAssign: (orderId: string, deliveryPerson: string) => void;
  onStartDelivery: (orderId: string) => void;
  onComplete: (orderId: string, paymentMethod: string) => void;
  onCancel: (orderId: string) => void;
}

export default function OrdersList({ 
  orders,
  onAssign,
  onStartDelivery,
  onComplete,
  onCancel
}: OrdersListProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);

  // Open assign dialog
  const handleOpenAssignDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setAssignDialogOpen(true);
  };

  // Submit assign form
  const handleAssignSubmit = () => {
    if (selectedOrderId && selectedDeliveryPerson) {
      onAssign(selectedOrderId, selectedDeliveryPerson);
      setAssignDialogOpen(false);
      setSelectedOrderId(null);
      setSelectedDeliveryPerson("");
    }
  };

  // Open complete dialog
  const handleOpenCompleteDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCompleteDialogOpen(true);
  };

  // Submit complete form
  const handleCompleteSubmit = () => {
    if (selectedOrderId) {
      onComplete(selectedOrderId, paymentMethod);
      setCompleteDialogOpen(false);
      setSelectedOrderId(null);
      setPaymentMethod("cash");
    }
  };

  // Get status badge
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

  // View order details
  const handleViewDetails = (orderId: string) => {
    setDetailsOrderId(orderId);
    setDetailsOpen(true);
  };

  // Format time ago
  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
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
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {order.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignDialog(order.id)}
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
                        onClick={() => onStartDelivery(order.id)}
                      >
                        <Truck size={14} className="mr-1" /> Iniciado
                      </Button>
                    )}
                    {order.status === "delivering" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCompleteDialog(order.id)}
                      >
                        <Check size={14} className="mr-1" /> Concluir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      <PhoneCall size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Clipboard size={32} className="mb-2 opacity-30" />
                    <p>Nenhum pedido encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Delivery Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Pedido</DialogTitle>
            <DialogDescription>
              Selecione o entregador para realizar esta entrega.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryPerson">Entregador</Label>
              <Select 
                value={selectedDeliveryPerson} 
                onValueChange={setSelectedDeliveryPerson}
              >
                <SelectTrigger id="deliveryPerson">
                  <SelectValue placeholder="Selecione o entregador" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.name}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignSubmit}
              disabled={!selectedDeliveryPerson}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Delivery Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
            <DialogDescription>
              Confirme os detalhes da entrega concluída.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="promissory">Promissória</SelectItem>
                  <SelectItem value="voucher">Vale Gás</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCompleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCompleteSubmit}
            >
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      {detailsOrderId && (
        <OrderDetails 
          orderId={detailsOrderId}
          orders={orders}
          isOpen={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
}
