
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Search, CreditCard, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AssignPromissoryDialog } from "./components/AssignPromissoryDialog";
import { PaymentDialog } from "./components/PaymentDialog";
import { ClientFidelityReport } from "./components/ClientFidelityReport";

// Dados mockados para exemplo
const promissoryNotes = [
  {
    id: 1,
    clientName: "João Silva",
    value: 350.00,
    dueDate: new Date("2024-04-30"),
    status: "pending",
    collector: null,
    paymentHistory: []
  },
  {
    id: 2,
    clientName: "Maria Santos",
    value: 780.50,
    dueDate: new Date("2024-04-28"),
    status: "assigned",
    collector: "Carlos Oliveira",
    paymentHistory: []
  },
  {
    id: 3,
    clientName: "Pedro Souza",
    value: 1200.00,
    dueDate: new Date("2024-05-05"),
    status: "pending",
    collector: null,
    paymentHistory: []
  },
  {
    id: 4,
    clientName: "Ana Oliveira",
    value: 450.00,
    dueDate: new Date("2024-04-25"),
    status: "paid",
    collector: null,
    paymentHistory: [
      { date: new Date("2024-04-25"), amount: 450.00, method: "Dinheiro" }
    ]
  },
  {
    id: 5,
    clientName: "Roberto Carlos",
    value: 980.00,
    dueDate: new Date("2024-04-20"),
    status: "overdue",
    collector: null,
    paymentHistory: []
  }
];

const collectors = [
  "Carlos Oliveira",
  "Ana Paula",
  "Roberto Santos",
  "Márcia Lima"
];

export default function Promissory() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState("vencendo");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromissory, setSelectedPromissory] = useState<number | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState("");

  const filteredPromissories = promissoryNotes.filter(note => {
    // Filtrar por data se uma data estiver selecionada
    if (selectedDate) {
      const noteDate = new Date(note.dueDate);
      if (noteDate.getDate() !== selectedDate.getDate() ||
          noteDate.getMonth() !== selectedDate.getMonth() ||
          noteDate.getFullYear() !== selectedDate.getFullYear()) {
        return false;
      }
    }
    
    // Filtrar por pesquisa se houver uma consulta
    if (searchQuery) {
      return note.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Filtrar por aba ativa
    if (activeTab === "vencendo" && note.status !== "pending" && note.status !== "overdue") {
      return false;
    } else if (activeTab === "atribuidas" && note.status !== "assigned") {
      return false;
    } else if (activeTab === "pagas" && note.status !== "paid") {
      return false;
    } else if (activeTab === "relatorio") {
      return false;
    }
    
    return true;
  });

  const handleAssignCollector = (promissoryId: number) => {
    setSelectedPromissory(promissoryId);
    setIsAssignDialogOpen(true);
  };

  const handlePayment = (promissoryId: number) => {
    setSelectedPromissory(promissoryId);
    setIsPaymentDialogOpen(true);
  };

  const confirmAssignment = () => {
    if (selectedPromissory && selectedCollector) {
      // Aqui você implementaria a lógica para atribuir o cobrador
      toast.success(`Promissória atribuída a ${selectedCollector}`);
      setIsAssignDialogOpen(false);
      setSelectedCollector("");
    }
  };

  const handleCollectorChange = (value: string) => {
    setSelectedCollector(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Promissórias</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) {
                    toast.info(`Filtrando por ${format(date, "dd/MM/yyyy")}`);
                  }
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Promissórias</CardTitle>
          <CardDescription>
            Gerencie as promissórias, cobranças e pagamentos pendentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="vencendo">Vencendo</TabsTrigger>
              <TabsTrigger value="atribuidas">Atribuídas</TabsTrigger>
              <TabsTrigger value="pagas">Pagas</TabsTrigger>
              <TabsTrigger value="relatorio">Relatório de Fidelidade</TabsTrigger>
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
                  {filteredPromissories
                    .map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>{note.clientName}</TableCell>
                        <TableCell>R$ {note.value.toFixed(2)}</TableCell>
                        <TableCell>{format(note.dueDate, "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={note.status === "overdue" ? "destructive" : "outline"}
                          >
                            {note.status === "pending" ? "Pendente" : 
                             note.status === "overdue" ? "Atrasada" : 
                             note.status === "assigned" ? "Atribuída" : "Paga"}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignCollector(note.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            Atribuir Entregador
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePayment(note.id)}
                            className="flex items-center gap-1"
                          >
                            <CreditCard className="h-4 w-4" />
                            Registrar Pagamento
                          </Button>
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
                  {filteredPromissories
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
                            onClick={() => handlePayment(note.id)}
                            className="flex items-center gap-1"
                          >
                            <CreditCard className="h-4 w-4" />
                            Registrar Pagamento
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="pagas">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promissoryNotes
                    .filter(note => note.status === "paid")
                    .map((note) => (
                      <TableRow key={note.id}>
                        <TableCell>{note.clientName}</TableCell>
                        <TableCell>R$ {note.value.toFixed(2)}</TableCell>
                        <TableCell>
                          {note.paymentHistory.length > 0
                            ? format(note.paymentHistory[0].date, "dd/MM/yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {note.paymentHistory.length > 0
                            ? note.paymentHistory[0].method
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="relatorio">
              <ClientFidelityReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <AssignPromissoryDialog 
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        selectedCollector={selectedCollector}
        onCollectorChange={handleCollectorChange}
        onSubmit={confirmAssignment}
        collectors={collectors}
      />
      
      <PaymentDialog 
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        promissoryId={selectedPromissory}
      />
    </div>
  );
}
