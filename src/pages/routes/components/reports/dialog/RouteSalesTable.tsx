
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RouteReport } from '../../../data/mockRouteReports';

interface RouteSalesTableProps {
  report: RouteReport;
}

export function RouteSalesTable({ report }: RouteSalesTableProps) {
  return (
    <div className="mt-4">
      <h4 className="font-medium mb-2">Vendas Realizadas</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Produtos</TableHead>
            <TableHead>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.details.clients.map((client, index) => (
            <TableRow key={index}>
              <TableCell>{client.name}</TableCell>
              <TableCell>{client.items}</TableCell>
              <TableCell>R$ {client.value.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
