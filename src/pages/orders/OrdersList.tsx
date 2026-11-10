import type { AssignOptions } from "./hooks/useOrderMutations";

import React, { useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Order } from "./types";
import { CompleteOrderDialog, type CompleteOrderPayload } from "./components/CompleteOrderDialog";
import { AssignOrderDialog } from "./components/AssignOrderDialog";
import { OrderTableRow } from "./components/OrderTableRow";
import { TablePagination, paginate } from "@/components/ui/TablePagination";
import { exportToCsv } from "@/utils/csvExport";

const PAGE_SIZE = 10;

interface OrdersListProps {
  orders: Order[];
  loading: boolean;
  onAssignOrder: (orderId: string, deliveryPerson: string, opts?: AssignOptions) => void;
  onStartDelivery: (orderId: string) => void;
  onCompleteOrder: (orderId: string, payload: CompleteOrderPayload) => void;
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
  const [page, setPage] = useState(1);

  const paginatedOrders = useMemo(
    () => paginate(orders, page, PAGE_SIZE),
    [orders, page]
  );

  const handleExport = useCallback(() => {
    exportToCsv(
      `pedidos-${new Date().toISOString().slice(0, 10)}`,
      [
        { header: "ID", accessor: (o: Order) => o.id },
        { header: "Cliente", accessor: (o: Order) => o.clientName },
        { header: "Telefone", accessor: (o: Order) => o.clientPhone },
        { header: "Endereço", accessor: (o: Order) => `${o.address.street}, ${o.address.number}` },
        { header: "Produto", accessor: (o: Order) => o.product },
        { header: "Quantidade", accessor: (o: Order) => o.quantity },
        { header: "Preço", accessor: (o: Order) => o.price },
        { header: "Status", accessor: (o: Order) => o.status },
        { header: "Criado em", accessor: (o: Order) => o.createdAt },
      ],
      orders
    );
  }, [orders]);

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

  const handleAssignSubmit = useCallback((opts?: AssignOptions) => {
    if (selectedOrder && selectedDeliveryPerson) {
      onAssignOrder(selectedOrder, selectedDeliveryPerson, opts);
      setSelectedDeliveryPerson("");
      setIsAssignDialogOpen(false);
    }
  }, [selectedOrder, selectedDeliveryPerson, onAssignOrder]);

  const handleCompleteSubmit = useCallback((payload: CompleteOrderPayload) => {
    if (selectedOrder) {
      onCompleteOrder(selectedOrder, payload);
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
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={orders.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
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
          {paginatedOrders.map((order) => (
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

      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={orders.length}
        onPageChange={setPage}
      />

      <AssignOrderDialog
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        order={orders.find((o) => o.id === selectedOrder) || null}
        selectedDeliveryPerson={selectedDeliveryPerson}
        onDeliveryPersonChange={handleDeliveryPersonChange}
        onSubmit={handleAssignSubmit}
      />

      <CompleteOrderDialog
        order={orders.find((o) => o.id === selectedOrder) || null}
        isOpen={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        onSubmit={handleCompleteSubmit}
      />
    </div>
  );
}

export const OrdersList = memo(OrdersListComponent);
