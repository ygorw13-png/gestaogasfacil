
import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "./types";
import { CompleteOrderDialog } from "./components/CompleteOrderDialog";
import { AssignOrderDialog } from "./components/AssignOrderDialog";
import { OrderTableRow } from "./components/OrderTableRow";

interface OrdersListProps {
  orders: Order[];
  loading: boolean;
  onAssignOrder: (orderId: string, deliveryPerson: string) => void;
  onStartDelivery: (orderId: string) => void;
  onCompleteOrder: (orderId: string, paymentMethod: string) => void;
  onCancelOrder: (orderId: string) => void;
}

function OrdersListComponent({ 
  orders, 
  loading,
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

  const handleAssignClick = useCallback((orderId: string) => {
    setSelectedOrder(orderId);
    setIsAssignDialogOpen(true);
  }, []);

  const handleCompleteClick = useCallback((orderId: string) => {
    setSelectedOrder(orderId);
    setIsCompleteDialogOpen(true);
  }, []);

  const handleDeliveryPersonChange = useCallback((value: string) => {
    setSelectedDeliveryPerson(value);
  }, []);

  const handleAssignSubmit = useCallback(() => {
    if (selectedOrder && selectedDeliveryPerson) {
      onAssignOrder(selectedOrder, selectedDeliveryPerson);
      setSelectedDeliveryPerson("");
      setIsAssignDialogOpen(false);
    }
  }, [selectedOrder, selectedDeliveryPerson, onAssignOrder]);

  const handleCompleteSubmit = useCallback((paymentMethod: string) => {
    if (selectedOrder) {
      onCompleteOrder(selectedOrder, paymentMethod);
      setIsCompleteDialogOpen(false);
    }
  }, [selectedOrder, onCompleteOrder]);

  const handleViewDetails = useCallback((orderId: string) => {
    navigate(`/orders/${orderId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                {Array(7).fill(0).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhum pedido encontrado</h3>
        <p className="text-sm text-gray-500">Você ainda não possui pedidos registrados.</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Horário</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
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
              onViewDetails={() => handleViewDetails(order.id)}
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
      />
      
      <CompleteOrderDialog
        isOpen={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        onSubmit={handleCompleteSubmit}
      />
    </div>
  );
}

export const OrdersList = memo(OrdersListComponent);
