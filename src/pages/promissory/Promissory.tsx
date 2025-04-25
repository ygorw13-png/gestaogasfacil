
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

// Dados mockados para exemplo
const promissoryNotes = [
  {
    id: 1,
    clientName: "João Silva",
    value: 350.00,
    dueDate: new Date("2024-04-30"),
    status: "pending",
    collector: null
  },
  {
    id: 2,
    clientName: "Maria Santos",
    value: 780.50,
    dueDate: new Date("2024-04-28"),
    status: "assigned",
    collector: "Carlos Oliveira"
  },
  {
    id: 3,
    clientName: "Pedro Souza",
    value: 1200.00,
    dueDate: new Date("2024-05-05"),
    status: "pending",
    collector: null
  }
];

const collectors = [
  "Carlos Oliveira",
  "Ana Paula",
  "Roberto Santos",
  "Márcia Lima"
];

export default function Promissory() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState("vencendo");

  const assignCollector = (promissoryId: number, collector: string) => {
    // Aqui você implementaria a lógica para atribuir o cobrador
    console.log(`Atribuindo ${collector} à promissória ${promissoryId}`);
  };

  const markAsPaid = (promissoryId: number) => {
    // Aqui você implementaria a lógica para marcar como pago
    console.log(`Marcando promissória ${promissoryId} como paga`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Promissórias</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Filtrar por data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Promissórias</CardTitle>
          <CardDescription>
            Gerencie as promissórias e pagamentos pendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="vencendo">Vencendo</TabsTrigger>
              <TabsTrigger value="atribuidas">Atribuídas</TabsTrigger>
            </TabsList>
            <TabsContent value="vencendo">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promissoryNotes
                    .filter(note => note.status === "pending")
                    .map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>{note.clientName}</TableCell>
                        <TableCell>R$ {note.value.toFixed(2)}</TableCell>
                        <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
                        <TableCell>{note.status === "pending" ? "Pendente" : "Atribuída"}</TableCell>
                        <TableCell>
                          <select 
                            className="border rounded px-2 py-1 mr-2"
                            onChange={(e) => assignCollector(note.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>Atribuir cobrador</option>
                            {collectors.map(collector => (
                              <option key={collector} value={collector}>
                                {collector}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="atribuidas">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Cobrador</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promissoryNotes
                    .filter(note => note.status === "assigned")
                    .map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>{note.clientName}</TableCell>
                        <TableCell>R$ {note.value.toFixed(2)}</TableCell>
                        <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
                        <TableCell>{note.collector}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsPaid(note.id)}
                          >
                            Marcar como pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
