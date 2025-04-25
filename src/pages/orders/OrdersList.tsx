
import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "./types";
import { Clipboard } from "lucide-react";
import OrderDetails from "./OrderDetails";
import { OrderTableRow } from "./components/OrderTableRow";
import { AssignOrderDialog } from "./components/AssignOrderDialog";
import { CompleteOrderDialog } from "./components/CompleteOrderDialog";

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

  const handleOpenAssignDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (selectedOrderId && selectedDeliveryPerson) {
      onAssign(selectedOrderId, selectedDeliveryPerson);
      setAssignDialogOpen(false);
      setSelectedOrderId(null);
      setSelectedDeliveryPerson("");
    }
  };

  const handleOpenCompleteDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCompleteDialogOpen(true);
  };

  const handleCompleteSubmit = () => {
    if (selectedOrderId) {
      onComplete(selectedOrderId, paymentMethod);
      setCompleteDialogOpen(false);
      setSelectedOrderId(null);
      setPaymentMethod("cash");
    }
  };

  const handleViewDetails = (orderId: string) => {
    setDetailsOrderId(orderId);
    setDetailsOpen(true);
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
              <OrderTableRow
                key={order.id}
                order={order}
                onAssign={() => handleOpenAssignDialog(order.id)}
                onStartDelivery={() => onStartDelivery(order.id)}
                onComplete={() => handleOpenCompleteDialog(order.id)}
                onCancel={() => onCancel(order.id)}
                onViewDetails={() => handleViewDetails(order.id)}
              />
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

      <AssignOrderDialog
        isOpen={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedDeliveryPerson={selectedDeliveryPerson}
        onDeliveryPersonChange={setSelectedDeliveryPerson}
        onSubmit={handleAssignSubmit}
        deliveryStaff={deliveryStaff}
      />

      <CompleteOrderDialog
        isOpen={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onSubmit={handleCompleteSubmit}
      />

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
