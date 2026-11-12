import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RouteFilters } from './list/RouteFilters';
import { RoutesTable } from './list/RoutesTable';
import { getStatusColor, getStatusText } from '../utils/routeStatusUtils';
import { useRotas } from '../hooks/useRotas';
import { RouteItem } from '../types';

const emptyInventory = {
  gasP13: 0, gasP20: 0, gasP45: 0,
  emptyGasP13: 0, emptyGasP20: 0, emptyGasP45: 0, water: 0,
};

export function RoutesList() {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { rotas, loading } = useRotas();

  const routes: RouteItem[] = useMemo(
    () =>
      rotas.map((r) => ({
        id: r.id,
        date: r.data,
        driverId: r.motorista_id || '',
        driverName: r.motorista_nome,
        destination: r.destino,
        clientsCount: r.clientes_count,
        status: r.status as RouteItem['status'],
        departureTime: r.hora_saida || '',
        returnTime: r.hora_retorno || undefined,
        inventory: { ...emptyInventory, ...(r.inventario || {}) },
      })),
    [rotas]
  );

  const filteredRoutes = routes.filter((route) => {
    const textMatch =
      filter === '' ||
      route.driverName.toLowerCase().includes(filter.toLowerCase()) ||
      route.destination.toLowerCase().includes(filter.toLowerCase());
    const statusMatch = statusFilter === 'all' || route.status === statusFilter;
    return textMatch && statusMatch;
  });

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold">Rotas</h2>
        <RouteFilters
          filter={filter}
          setFilter={setFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <RoutesTable
          filteredRoutes={filteredRoutes}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      )}
    </Card>
  );
}
