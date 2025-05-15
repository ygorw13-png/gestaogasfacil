
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, Calendar, Wrench } from "lucide-react";
import { MaintenanceItem } from "../../types";
import { formatDate, getStatusBadge, getPriorityBadge } from "../../utils/formatters";

interface UpcomingMaintenanceProps {
  maintenances: MaintenanceItem[];
}

export default function UpcomingMaintenance({ maintenances }: UpcomingMaintenanceProps) {
  const upcomingMaintenances = maintenances.filter(m => ["scheduled", "in-progress"].includes(m.status));
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Agendada</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Custo Estimado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcomingMaintenances.length > 0 ? (
            upcomingMaintenances.map((maintenance) => (
              <TableRow key={maintenance.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{maintenance.vehiclePlate}</span>
                  </div>
                </TableCell>
                <TableCell>{maintenance.type}</TableCell>
                <TableCell>{formatDate(maintenance.scheduledDate)}</TableCell>
                <TableCell>{getPriorityBadge(maintenance.priority)}</TableCell>
                <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
                <TableCell>R$ {maintenance.estimatedCost.toFixed(2)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm">
                    <Wrench className="mr-2 h-4 w-4" />
                    Concluir
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Não há manutenções agendadas.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
