
import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Truck, FileText } from "lucide-react";
import { RouteTableProps } from '../../types/routeListTypes';
import { RouteDetailsDialog } from './RouteDetailsDialog';
import { RouteStatusBadge } from './RouteStatusBadge';

export function RoutesTable({ filteredRoutes, getStatusColor, getStatusText }: RouteTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Motorista</TableHead>
          <TableHead>Destino</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Saída</TableHead>
          <TableHead>Retorno</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredRoutes.length > 0 ? (
          filteredRoutes.map((route) => (
            <TableRow key={route.id}>
              <TableCell>{new Date(route.date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>{route.driverName}</TableCell>
              <TableCell>{route.destination}</TableCell>
              <TableCell>
                <RouteStatusBadge status={route.status} />
              </TableCell>
              <TableCell>{route.departureTime}</TableCell>
              <TableCell>{route.returnTime || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </DialogTrigger>
                    <RouteDetailsDialog route={route} />
                  </Dialog>

                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Relatório
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
              Nenhuma rota encontrada com os critérios selecionados.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
