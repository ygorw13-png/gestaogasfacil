
import React from 'react';
import { 
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { RouteDetailsDialogProps } from '../../types/routeListTypes';
import { RouteStatusBadge } from './RouteStatusBadge';

export function RouteDetailsDialog({ route }: RouteDetailsDialogProps) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Detalhes da Rota</DialogTitle>
        <DialogDescription>
          Informações detalhadas sobre a rota {route.destination}.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Motorista</h3>
            <p>{route.driverName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Destino</h3>
            <p>{route.destination}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Data</h3>
            <p>{new Date(route.date).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Status</h3>
            <RouteStatusBadge status={route.status} />
          </div>
          <div>
            <h3 className="text-sm font-medium">Horário de Saída</h3>
            <p>{route.departureTime}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Horário de Retorno</h3>
            <p>{route.returnTime || 'Não retornou'}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Inventário de Saída</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Gás P13</p>
              <p className="font-medium">{route.inventory.gasP13}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Gás P20</p>
              <p className="font-medium">{route.inventory.gasP20}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Gás P45</p>
              <p className="font-medium">{route.inventory.gasP45}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Água</p>
              <p className="font-medium">{route.inventory.water}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Vasilhame P13</p>
              <p className="font-medium">{route.inventory.emptyGasP13}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Vasilhame P20</p>
              <p className="font-medium">{route.inventory.emptyGasP20}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-500">Vasilhame P45</p>
              <p className="font-medium">{route.inventory.emptyGasP45}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-1" />
            Gerar Relatório
          </Button>
          <Button variant="default">Verificar Retorno</Button>
        </div>
      </div>
    </DialogContent>
  );
}
