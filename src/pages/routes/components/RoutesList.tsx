
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { mockRoutes } from '../data/mockRoutes';
import { RouteFilters } from './list/RouteFilters';
import { RoutesTable } from './list/RoutesTable';
import { getStatusColor, getStatusText } from '../utils/routeStatusUtils';

export function RoutesList() {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtrar rotas com base nos critérios selecionados
  const filteredRoutes = mockRoutes.filter(route => {
    // Filtro por texto (motorista, destino)
    const textMatch = filter === '' || 
      route.driverName.toLowerCase().includes(filter.toLowerCase()) || 
      route.destination.toLowerCase().includes(filter.toLowerCase());
    
    // Filtro por status
    const statusMatch = statusFilter === 'all' || route.status === statusFilter;
    
    return textMatch && statusMatch;
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Rotas Ativas</h2>
        <RouteFilters 
          filter={filter}
          setFilter={setFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>
      
      <RoutesTable 
        filteredRoutes={filteredRoutes}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />
    </Card>
  );
}
