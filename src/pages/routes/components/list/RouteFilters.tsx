
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RouteFiltersProps } from '../../types/routeListTypes';

export function RouteFilters({ filter, setFilter, statusFilter, setStatusFilter }: RouteFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Input
        placeholder="Buscar por motorista ou destino"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-64"
      />
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Status</SelectItem>
          <SelectItem value="preparing">Em Preparação</SelectItem>
          <SelectItem value="in-progress">Em Progresso</SelectItem>
          <SelectItem value="completed">Concluída</SelectItem>
          <SelectItem value="verified">Verificada</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
