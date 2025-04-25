
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, FileText, Fuel } from "lucide-react";
import NewFuelEntryForm from "./forms/NewFuelEntryForm";
import { useToast } from "@/hooks/use-toast";
import { mockFuelEntries } from "../data/mockData";

export default function FuelTracking() {
  const [open, setOpen] = useState(false);
  const [fuelEntries, setFuelEntries] = useState(mockFuelEntries);
  const { toast } = useToast();

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const calculateEfficiency = (entry) => {
    if (!entry.previousMileage || !entry.mileage || !entry.liters) return '-';
    const distance = entry.mileage - entry.previousMileage;
    if (distance <= 0) return '-';
    return (distance / entry.liters).toFixed(2) + ' km/L';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Abastecimentos</CardTitle>
            <CardDescription>
              Gerencie os abastecimentos da frota
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Abastecimento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Abastecimento</DialogTitle>
              </DialogHeader>
              <NewFuelEntryForm 
                onSuccess={() => {
                  setOpen(false);
                  toast({
                    title: "Abastecimento registrado",
                    description: "O abastecimento foi registrado com sucesso."
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
              <TableHead>Data</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Combustível</TableHead>
              <TableHead>Litros</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Consumo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fuelEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{entry.vehiclePlate}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>{entry.mileage} km</TableCell>
                <TableCell>{entry.fuelType}</TableCell>
                <TableCell>{entry.liters.toFixed(2)} L</TableCell>
                <TableCell>R$ {entry.cost.toFixed(2)}</TableCell>
                <TableCell>{calculateEfficiency(entry)}</TableCell>
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
        
        {fuelEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Fuel className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>Não há abastecimentos registrados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
