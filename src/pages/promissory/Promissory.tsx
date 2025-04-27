import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { mockPromissoryNotes, collectors } from "./data/mockData";
import { PendingPromissoriesTable } from "./components/PendingPromissoriesTable";
import { AssignPromissoryDialog } from "./components/AssignPromissoryDialog";
import { AssignedPromissoriesTable } from "./components/AssignedPromissoriesTable";
import { PaidPromissoriesTable } from "./components/PaidPromissoriesTable";
import { PaymentDialog } from "./components/PaymentDialog";
import { ClientFidelityReport } from "./components/ClientFidelityReport";
import { PromissoryFilters } from "./components/PromissoryFilters";
import { PromissoryReportButton } from "./components/PromissoryReportButton";
import { NewPromissoryDialog } from "./components/NewPromissoryDialog";
import { PromissoryNote } from "./types";

export default function Promissory() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<PromissoryNote[]>(mockPromissoryNotes);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNewPromissoryDialogOpen, setIsNewPromissoryDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Filtra as notas promissórias com base nos critérios selecionados
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const statusMatch = selectedStatus === "all" || note.status === selectedStatus;
      const clientMatch = selectedClient === "all" || note.clientName === selectedClient;
      return statusMatch && clientMatch;
    });
  }, [notes, selectedStatus, selectedClient]);

  // Notas separadas por status para as abas
  const pendingNotes = useMemo(() => 
    filteredNotes.filter(note => note.status === "pending"), 
    [filteredNotes]
  );

  const assignedNotes = useMemo(() => 
    filteredNotes.filter(note => note.status === "assigned"), 
    [filteredNotes]
  );

  const paidNotes = useMemo(() => 
    filteredNotes.filter(note => note.status === "paid"), 
    [filteredNotes]
  );

  // Lista de clientes para o filtro
  const clients = useMemo(() => {
    const uniqueClients = new Set<string>();
    notes.forEach(note => uniqueClients.add(note.clientName));
    return Array.from(uniqueClients);
  }, [notes]);

  // Manipuladores de eventos
  const handleAssign = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = (collector: string) => {
    if (selectedNoteId !== null) {
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === selectedNoteId 
            ? { ...note, status: "assigned", assignedTo: collector } 
            : note
        )
      );
      
      toast({
        title: "Nota promissória atribuída",
        description: `Nota atribuída a ${collector} com sucesso.`
      });
      
      setIsAssignDialogOpen(false);
      setSelectedNoteId(null);
    }
  };

  const handlePayment = (id: string) => {
    setSelectedNoteId(id);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (amount: number, method: string) => {
    if (selectedNoteId !== null) {
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === selectedNoteId 
            ? { 
                ...note, 
                status: "paid",
                paidAt: new Date()
              } 
            : note
        )
      );
      
      toast({
        title: "Pagamento registrado",
        description: `Pagamento de R$ ${amount.toFixed(2)} registrado com sucesso.`
      });
      
      setIsPaymentDialogOpen(false);
      setSelectedNoteId(null);
    }
  };

  const handleNewPromissorySubmit = (data: {
    clientName: string;
    value: number;
    dueDate: Date;
    collector: string | null;
  }) => {
    const highestId = Math.max(...notes.map(note => parseInt(note.id)));
    const newId = (highestId + 1).toString();
    
    const newNote: PromissoryNote = {
      id: newId,
      clientName: data.clientName,
      value: data.value,
      dueDate: data.dueDate,
      status: data.collector ? "assigned" : "pending",
      createdAt: new Date(),
      assignedTo: data.collector || undefined
    };
    
    setNotes(prevNotes => [...prevNotes, newNote]);
    
    toast({
      title: "Nota promissória criada",
      description: `Nota de R$ ${data.value.toFixed(2)} para ${data.clientName} registrada com sucesso.`
    });
    
    setIsNewPromissoryDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Promissórias</h1>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setIsNewPromissoryDialogOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Promissória
          </Button>
          
          <PromissoryReportButton 
            promissories={filteredNotes}
            statusFilter={selectedStatus !== "all" ? selectedStatus : undefined}
          />
        </div>
      </div>

      <PromissoryFilters 
        selectedStatus={selectedStatus}
        selectedClient={selectedClient}
        onStatusChange={setSelectedStatus}
        onClientChange={setSelectedClient}
        clients={clients}
      />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingNotes.length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Atribuídas ({assignedNotes.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagas ({paidNotes.length})
          </TabsTrigger>
          <TabsTrigger value="fidelity">
            Fidelidade de Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <PendingPromissoriesTable 
            promissories={pendingNotes} 
            onAssign={handleAssign}
            onPayment={handlePayment}
          />
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <AssignedPromissoriesTable 
            promissories={assignedNotes} 
            onPayment={handlePayment} 
          />
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <PaidPromissoriesTable promissories={paidNotes} />
        </TabsContent>

        <TabsContent value="fidelity" className="space-y-4">
          <ClientFidelityReport notes={notes} />
        </TabsContent>
      </Tabs>

      <AssignPromissoryDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        collectors={collectors}
        onSubmit={handleAssignSubmit}
      />

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onSubmit={handlePaymentSubmit}
        noteId={selectedNoteId}
        notes={notes}
      />

      <NewPromissoryDialog 
        open={isNewPromissoryDialogOpen}
        onOpenChange={setIsNewPromissoryDialogOpen}
        onSubmit={handleNewPromissorySubmit}
        collectors={collectors}
        clients={clients}
      />
    </div>
  );
}
