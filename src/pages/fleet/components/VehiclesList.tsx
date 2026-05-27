import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Car, FileText } from "lucide-react";
import NewVehicleForm from "./forms/NewVehicleForm";
import EditVehicleForm from "./forms/EditVehicleForm";
import { useToast } from "@/hooks/use-toast";
import VehicleDetailsDialog from "./dialogs/VehicleDetailsDialog";
import { useFleet } from "../context/FleetContext";

export default function VehiclesList() {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { vehicles, deleteVehicle } = useFleet();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { toast } = useToast();

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
      await deleteVehicle(id);
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditDialogOpen(true);
  };

  const handleDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailsDialogOpen(true);
  };

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Veículos</CardTitle>
            <CardDescription>
              Gerencie os veículos da empresa
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Veículo</DialogTitle>
              </DialogHeader>
              <NewVehicleForm 
                onSuccess={() => {
                  setOpen(false);
                  toast({
                    title: "Veículo adicionado",
                    description: "O veículo foi adicionado com sucesso."
                  });
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quilometragem</TableHead>
              <TableHead>Última Manutenção</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.plate}</TableCell>
                <TableCell>{vehicle.model}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>{vehicle.type === 'car' ? 'Carro' : vehicle.type === 'truck' ? 'Caminhão' : 'Van'}</TableCell>
                <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                <TableCell>{vehicle.mileage} km</TableCell>
                <TableCell>{vehicle.lastMaintenance || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleDetails(vehicle)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <EditVehicleForm 
              vehicle={selectedVehicle} 
              onSuccess={() => {
                setEditDialogOpen(false);
                toast({
                  title: "Veículo atualizado",
                  description: "O veículo foi atualizado com sucesso."
                });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Veículo</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <VehicleDetailsDialog vehicle={selectedVehicle} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
