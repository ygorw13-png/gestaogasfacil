
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Edit, Trash2, Car } from "lucide-react";
import NewAssignmentForm from "./forms/NewAssignmentForm";
import { useToast } from "@/hooks/use-toast";
import { mockAssignments } from "../data/mockData";

export default function VehicleAssignments() {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState(mockAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = (id) => {
    if (confirm("Tem certeza que deseja excluir esta atribuição?")) {
      setAssignments(assignments.filter(assignment => assignment.id !== id));
      toast({
        title: "Atribuição removida",
        description: "A atribuição foi removida com sucesso.",
      });
    }
  };

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment);
    setEditDialogOpen(true);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 
      <Badge className="bg-green-500">Ativa</Badge> : 
      <Badge className="bg-gray-500">Encerrada</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Atribuições</CardTitle>
            <CardDescription>
              Gerencie as atribuições de veículos aos funcionários
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Atribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Atribuição</DialogTitle>
              </DialogHeader>
              <NewAssignmentForm 
                onSuccess={() => {
                  setOpen(false);
                  toast({
                    title: "Atribuição criada",
                    description: "A atribuição foi criada com sucesso."
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
              <TableHead>Veículo</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{assignment.vehiclePlate}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{assignment.employeeName}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(assignment.startDate)}</TableCell>
                <TableCell>{formatDate(assignment.endDate)}</TableCell>
                <TableCell>{getStatusBadge(assignment.isActive)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(assignment)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)}>
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
            <DialogTitle>Editar Atribuição</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <NewAssignmentForm 
              assignment={selectedAssignment}
              isEditing={true}
              onSuccess={() => {
                setEditDialogOpen(false);
                toast({
                  title: "Atribuição atualizada",
                  description: "A atribuição foi atualizada com sucesso."
                });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
