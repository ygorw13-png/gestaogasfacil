
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Order } from "./types";
import { CompleteOrderDialog } from "./components/CompleteOrderDialog";
import { AssignOrderDialog } from "./components/AssignOrderDialog";
import { OrderTableRow } from "./components/OrderTableRow";

interface OrdersListProps {
  orders: Order[];
  onAssignOrder: (orderId: string, deliveryPerson: string) => void;
  onStartDelivery: (orderId: string) => void;
  onCompleteOrder: (orderId: string, paymentMethod: string) => void;
  onCancelOrder: (orderId: string) => void;
}

const deliveryStaff = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Maria Santos" },
  { id: "3", name: "Pedro Oliveira" },
];

export function OrdersList({ 
  orders, 
  onAssignOrder, 
  onStartDelivery, 
  onCompleteOrder, 
  onCancelOrder 
}: OrdersListProps) {
  const navigate = useNavigate();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState("");

  const handleAssignClick = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsAssignDialogOpen(true);
  };

  const handleCompleteClick = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsCompleteDialogOpen(true);
  };

  const handleDeliveryPersonChange = (value: string) => {
    setSelectedDeliveryPerson(value);
  };

  const handleAssignSubmit = () => {
    if (selectedOrder && selectedDeliveryPerson) {
      onAssignOrder(selectedOrder, selectedDeliveryPerson);
      setSelectedDeliveryPerson("");
      setIsAssignDialogOpen(false);
    }
  };

  const handleCompleteSubmit = (paymentMethod: string) => {
    if (selectedOrder) {
      onCompleteOrder(selectedOrder, paymentMethod);
      setIsCompleteDialogOpen(false);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <OrderTableRow
              key={order.id}
              order={order}
              onAssign={handleAssignClick}
              onStartClick={onStartDelivery}
              onComplete={handleCompleteClick}
              onCancel={onCancelOrder}
              onViewDetails={() => navigate(`/orders/${order.id}`)}
            />
          ))}
        </TableBody>
      </Table>
      
      <AssignOrderDialog
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        selectedDeliveryPerson={selectedDeliveryPerson}
        onDeliveryPersonChange={handleDeliveryPersonChange}
        onSubmit={handleAssignSubmit}
        deliveryStaff={deliveryStaff}
      />
      
      <CompleteOrderDialog
        isOpen={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        onSubmit={handleCompleteSubmit}
      />
    </div>
  );
}
