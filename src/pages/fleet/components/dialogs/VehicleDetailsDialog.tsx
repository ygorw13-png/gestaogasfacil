
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, FileText, Calendar, Wrench, Fuel } from "lucide-react";

interface VehicleDetailsDialogProps {
  vehicle: any;
}

export default function VehicleDetailsDialog({ vehicle }: VehicleDetailsDialogProps) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativo</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500">Em Manutenção</Badge>;
      case "inactive":
        return <Badge className="bg-red-500">Inativo</Badge>;
      default:
        return <Badge className="bg-gray-500">Desconhecido</Badge>;
    }
  };

  const getVehicleTypeLabel = (type) => {
    switch (type) {
      case "car":
        return "Carro";
      case "truck":
        return "Caminhão";
      case "van":
        return "Van";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="bg-muted rounded-full p-3">
          <Car className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{vehicle.model}</h2>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Placa: {vehicle.plate}</span>
            <span>•</span>
            <span className="text-muted-foreground">Ano: {vehicle.year}</span>
            <span>•</span>
            <span>{getStatusBadge(vehicle.status)}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenções</TabsTrigger>
          <TabsTrigger value="fuel">Abastecimentos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{vehicle.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="font-medium">{vehicle.plate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{getVehicleTypeLabel(vehicle.type)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(vehicle.status)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Quilometragem</p>
                  <p className="font-medium">{vehicle.mileage} km</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Última Manutenção</p>
                  <p className="font-medium">{vehicle.lastMaintenance || 'Não registrado'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vencimento de Documentos</p>
                  <p className="font-medium">{vehicle.documentExpiration || 'Não registrado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Histórico de Manutenções</h3>
                <Button size="sm">
                  <Wrench className="mr-2 h-4 w-4" />
                  Nova Manutenção
                </Button>
              </div>
              
              {vehicle.maintenanceHistory?.length ? (
                <div className="space-y-4">
                  {vehicle.maintenanceHistory.map((maintenance) => (
                    <div key={maintenance.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{maintenance.type}</h4>
                          <p className="text-sm text-muted-foreground">{maintenance.date}</p>
                        </div>
                        <p className="font-medium">R$ {maintenance.cost.toFixed(2)}</p>
                      </div>
                      <p className="mt-2 text-sm">{maintenance.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Nenhuma manutenção registrada para este veículo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fuel">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Histórico de Abastecimentos</h3>
                <Button size="sm">
                  <Fuel className="mr-2 h-4 w-4" />
                  Novo Abastecimento
                </Button>
              </div>
              
              {vehicle.fuelHistory?.length ? (
                <div className="space-y-4">
                  {vehicle.fuelHistory.map((fuel) => (
                    <div key={fuel.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{fuel.date}</h4>
                          <p className="text-sm text-muted-foreground">Posto: {fuel.station}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{fuel.liters}L</p>
                          <p className="text-sm text-muted-foreground">R$ {fuel.cost.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm flex justify-between">
                        <span>Km: {fuel.mileage}</span>
                        <span>Preço/L: R$ {(fuel.cost / fuel.liters).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Fuel className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Nenhum abastecimento registrado para este veículo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Documentos</h3>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Novo Documento
                </Button>
              </div>
              
              {vehicle.documents?.length ? (
                <div className="space-y-4">
                  {vehicle.documents.map((doc) => (
                    <div key={doc.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground">Vencimento: {doc.expiration}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Nenhum documento registrado para este veículo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
