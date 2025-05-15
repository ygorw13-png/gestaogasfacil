
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Car, FileText } from "lucide-react";
import { MaintenanceItem } from "../../types";
import { formatDate, getStatusBadge } from "../../utils/formatters";

interface MaintenanceHistoryProps {
  maintenances: MaintenanceItem[];
}

export default function MaintenanceHistory({ maintenances }: MaintenanceHistoryProps) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maintenances.map((maintenance) => (
            <TableRow key={maintenance.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span>{maintenance.vehiclePlate}</span>
                </div>
              </TableCell>
              <TableCell>{maintenance.type}</TableCell>
              <TableCell>{formatDate(maintenance.completionDate || maintenance.scheduledDate)}</TableCell>
              <TableCell>{getStatusBadge(maintenance.status)}</TableCell>
              <TableCell>R$ {(maintenance.actualCost || maintenance.estimatedCost).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
