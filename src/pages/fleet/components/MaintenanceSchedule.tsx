import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Car, Wrench, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewMaintenanceForm from "./forms/NewMaintenanceForm";
import { useToast } from "@/hooks/use-toast";
import { mockMaintenances } from "../data";

export default function MaintenanceSchedule() {
  const [open, setOpen] = useState(false);
  const [maintenances, setMaintenances] = useState(mockMaintenances);
  const { toast } = useToast();
  
  const getStatusBadge = (status) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500">Agendada</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-500">Em Andamento</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Concluída</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-500">Desconhecido</Badge>;
    }
  };
  
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Média</Badge>;
      case "low":
        return <Badge className="bg-green-500">Baixa</Badge>;
      default:
        return <Badge className="bg-gray-500">Normal</Badge>;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Manutenção</DialogTitle>
              </DialogHeader>
              <NewMaintenanceForm 
                onSuccess={() => {
                  setOpen(false);
                  toast({
                    title: "Manutenção agendada",
                    description: "A manutenção foi agendada com sucesso."
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <TabsContent value="upcoming">
          <Card>
            <CardContent className="pt-6">
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
                  {maintenances
                    .filter(m => ["scheduled", "in-progress"].includes(m.status))
                    .map((maintenance) => (
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
                  ))}
                </TableBody>
              </Table>
              
              {maintenances.filter(m => ["scheduled", "in-progress"].includes(m.status)).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Não há manutenções agendadas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardContent className="pt-6">
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
                  {maintenances
                    .filter(m => m.status === "completed")
                    .map((maintenance) => (
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
                  ))}
                </TableBody>
              </Table>
              
              {maintenances.filter(m => m.status === "completed").length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>Não há manutenções concluídas recentes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
