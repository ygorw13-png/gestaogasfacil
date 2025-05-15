
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Car, FileText, Wrench } from "lucide-react";
import { MaintenanceItem } from "../../types";
import { formatDate } from "../../utils/formatters";

interface CompletedMaintenanceProps {
  maintenances: MaintenanceItem[];
}

export default function CompletedMaintenance({ maintenances }: CompletedMaintenanceProps) {
  const completedMaintenances = maintenances.filter(m => m.status === "completed");
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Conclusão</TableHead>
            <TableHead>Km</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {completedMaintenances.length > 0 ? (
            completedMaintenances.map((maintenance) => (
              <TableRow key={maintenance.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{maintenance.vehiclePlate}</span>
                  </div>
                </TableCell>
                <TableCell>{maintenance.type}</TableCell>
                <TableCell>{formatDate(maintenance.completionDate || maintenance.scheduledDate)}</TableCell>
                <TableCell>{maintenance.mileage} km</TableCell>
                <TableCell>R$ {(maintenance.actualCost || maintenance.estimatedCost).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Não há manutenções concluídas recentes.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
