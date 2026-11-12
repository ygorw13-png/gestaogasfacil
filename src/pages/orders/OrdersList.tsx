import type { AssignOptions } from "./hooks/useOrderMutations";

import { useState, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Order } from "./types";
import { AssignOrderDialog } from "./components/AssignOrderDialog";
import { ConcluirEntregaDialog } from "./components/ConcluirEntregaDialog";
import { ReatribuirDialog } from "./components/ReatribuirDialog";
import { RegularizarDialog } from "./components/RegularizarDialog";
import { OrderTableRow } from "./components/OrderTableRow";
import { OrderCard } from "./components/OrderCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { TablePagination, paginate } from "@/components/ui/TablePagination";
import { exportToCsv } from "@/utils/csvExport";
import { numeroPedido, estadoEntrega, ROTULO_ESTADO } from "@/lib/entregas";
import { useUserRole } from "@/hooks/useUserRole";

const PAGE_SIZE = 10;

interface OrdersListProps {
  orders: Order[];
  loading: boolean;
  hoje: string;
  vazio?: string;
  onAssignOrder: (orderId: string, deliveryPerson: string, opts?: AssignOptions) => Promise<boolean> | void;
  onCancelOrder: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
  /** Recarrega a lista depois de uma ação confirmada. */
  onRefresh: () => void;
}

type Dialogo = "atribuir" | "reatribuir" | "concluir" | "regularizar" | null;

function OrdersListComponent({ orders, loading, hoje, vazio, onAssignOrder, onCancelOrder, onViewDetails, onRefresh }: OrdersListProps) {
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState("");
  const [page, setPage] = useState(1);

  const paginatedOrders = useMemo(() => paginate(orders, page, PAGE_SIZE), [orders, page]);
  const atual = orders.find((o) => o.id === selectedOrder) || null;

  const handleExport = useCallback(() => {
    exportToCsv(
      `pedidos-${hoje}`,
      [
        { header: "Pedido", accessor: (o: Order) => numeroPedido(o.id) },
        { header: "ID", accessor: (o: Order) => o.id },
        { header: "Cliente", accessor: (o: Order) => o.clientName },
        { header: "Telefone", accessor: (o: Order) => o.clientPhone },
        { header: "Endereço", accessor: (o: Order) => `${o.address.street}, ${o.address.number}` },
        { header: "Produto", accessor: (o: Order) => o.product },
        { header: "Quantidade", accessor: (o: Order) => o.quantity },
        { header: "Preço", accessor: (o: Order) => o.price },
        { header: "Situação", accessor: (o: Order) => ROTULO_ESTADO[estadoEntrega(o)] },
        { header: "Data da entrega", accessor: (o: Order) => o.dataEntrega ?? "" },
        { header: "Criado em", accessor: (o: Order) => o.createdAt },
      ],
      orders
    );
  }, [orders, hoje]);

  const abrir = useCallback((d: Dialogo) => (orderId: string) => { setSelectedOrder(orderId); setSelectedDeliveryPerson(""); setDialogo(d); }, []);
  // Fechar/cancelar só fecha: nenhum envio, nenhuma alteração, nenhum aviso de erro.
  const fechar = useCallback((open: boolean) => { if (!open) setDialogo(null); }, []);

  const handleAssignSubmit = useCallback(async (opts?: AssignOptions) => {
    if (selectedOrder && selectedDeliveryPerson) {
      const ok = await onAssignOrder(selectedOrder, selectedDeliveryPerson, opts);
      if (ok === false) return;
      setSelectedDeliveryPerson("");
      setDialogo(null);
      onRefresh();
    }
  }, [selectedOrder, selectedDeliveryPerson, onAssignOrder, onRefresh]);

  const cabecalho = (
    <TableHeader>
      <TableRow>
        <TableHead>Pedido</TableHead>
        <TableHead>Cliente</TableHead>
        <TableHead>Endereço</TableHead>
        <TableHead>Produto</TableHead>
        <TableHead>Qtd.</TableHead>
        <TableHead>Situação</TableHead>
        <TableHead className="text-right">Ações</TableHead>
      </TableRow>
    </TableHeader>
  );

  if (loading && orders.length === 0 && isMobile) {
    return <div className="space-y-2">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}</div>;
  }
  if (loading && orders.length === 0) {
    return (
      <Table>
        {cabecalho}
        <TableBody>
          {Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>{Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="mb-2 text-lg font-medium">Nenhuma entrega aqui</h3>
          <p className="text-sm text-muted-foreground">{vazio ?? "Nenhum pedido neste filtro."}</p>
        </div>
      ) : (
        <>
          <div className="mb-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
          </div>
          {isMobile ? (
            <div className="space-y-2">
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  hoje={hoje}
                  isAdmin={isAdmin}
                  onAssign={abrir("atribuir")}
                  onReassign={abrir("reatribuir")}
                  onComplete={abrir("concluir")}
                  onRegularize={abrir("regularizar")}
                  onCancel={onCancelOrder}
                  onViewDetails={() => onViewDetails(order.id)}
                />
              ))}
            </div>
          ) : (
          <Table>
            {cabecalho}
            <TableBody>
              {paginatedOrders.map((order) => (
                <OrderTableRow
                  key={order.id}
                  order={order}
                  hoje={hoje}
                  isAdmin={isAdmin}
                  onAssign={abrir("atribuir")}
                  onReassign={abrir("reatribuir")}
                  onComplete={abrir("concluir")}
                  onRegularize={abrir("regularizar")}
                  onCancel={onCancelOrder}
                  onViewDetails={() => onViewDetails(order.id)}
                />
              ))}
            </TableBody>
          </Table>
          )}
          <TablePagination page={page} pageSize={PAGE_SIZE} totalItems={orders.length} onPageChange={setPage} />
        </>
      )}

      <AssignOrderDialog
        isOpen={dialogo === "atribuir"}
        onOpenChange={fechar}
        order={atual}
        selectedDeliveryPerson={selectedDeliveryPerson}
        onDeliveryPersonChange={setSelectedDeliveryPerson}
        onSubmit={handleAssignSubmit}
      />
      <ReatribuirDialog order={atual} isOpen={dialogo === "reatribuir"} onOpenChange={fechar} onFeito={onRefresh} />
      <ConcluirEntregaDialog order={atual} isOpen={dialogo === "concluir"} onOpenChange={fechar} onConcluida={onRefresh}
        onReatribuir={abrir("reatribuir")} />
      <RegularizarDialog order={atual} isOpen={dialogo === "regularizar"} onOpenChange={fechar} onFeito={onRefresh}
        onCancelar={onCancelOrder} />
    </div>
  );
}

export const OrdersList = memo(OrdersListComponent);
