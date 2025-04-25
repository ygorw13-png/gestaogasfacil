
import React, { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Truck, FileText } from "lucide-react";
import { RouteItem } from "../types";

// Mock data para rotas
const mockRoutes: RouteItem[] = [
  {
    id: "1",
    date: "2025-04-25",
    driverId: "1",
    driverName: "João Silva",
    destination: "Povoado Santa Maria",
    clientsCount: 8,
    status: "in-progress",
    departureTime: "08:30",
    inventory: {
      gasP13: 30,
      gasP20: 5,
      gasP45: 2,
      emptyGasP13: 10,
      emptyGasP20: 2,
      emptyGasP45: 0,
      water: 15
    }
  },
  {
    id: "2",
    date: "2025-04-25",
    driverId: "2",
    driverName: "Pedro Santos",
    destination: "Cidade de São Miguel",
    clientsCount: 12,
    status: "completed",
    departureTime: "07:15",
    returnTime: "16:45",
    inventory: {
      gasP13: 45,
      gasP20: 8,
      gasP45: 5,
      emptyGasP13: 15,
      emptyGasP20: 4,
      emptyGasP45: 1,
      water: 25
    }
  },
  {
    id: "3",
    date: "2025-04-24",
    driverId: "3",
    driverName: "Carlos Ferreira",
    destination: "Povoado Baixa Grande",
    clientsCount: 6,
    status: "verified",
    departureTime: "08:00",
    returnTime: "14:30",
    inventory: {
      gasP13: 20,
      gasP20: 3,
      gasP45: 0,
      emptyGasP13: 8,
      emptyGasP20: 0,
      emptyGasP45: 0,
      water: 10
    }
  }
];

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

  // Função para obter a cor de status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'verified': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    switch(status) {
      case 'preparing': return 'Em Preparação';
      case 'in-progress': return 'Em Progresso';
      case 'completed': return 'Concluída';
      case 'verified': return 'Verificada';
      default: return status;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Rotas Ativas</h2>
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
      </div>

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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(route.status)}`}>
                    {getStatusText(route.status)}
                  </span>
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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(route.status)}`}>
                                {getStatusText(route.status)}
                              </span>
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
    </Card>
  );
}
