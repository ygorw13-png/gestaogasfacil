
import { useState, useMemo } from "react";
import { PromissoryNote } from "../types";
import { mockPromissoryNotes } from "../data/mockData";
import { useToast } from "@/hooks/use-toast";

export function usePromissoryNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<PromissoryNote[]>(mockPromissoryNotes);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const statusMatch = selectedStatus === "all" || note.status === selectedStatus;
      const clientMatch = selectedClient === "all" || note.clientName === selectedClient;
      return statusMatch && clientMatch;
    });
  }, [notes, selectedStatus, selectedClient]);

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

  const clients = useMemo(() => {
    const uniqueClients = new Set<string>();
    notes.forEach(note => uniqueClients.add(note.clientName));
    return Array.from(uniqueClients);
  }, [notes]);

  const handleAssign = (collector: string) => {
    if (selectedNoteId) {
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
    }
  };

  const handlePayment = (amount: number, method: string) => {
    if (selectedNoteId) {
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
    }
  };

  const handleNewPromissory = (data: {
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
  };

  return {
    notes,
    filteredNotes,
    pendingNotes,
    assignedNotes,
    paidNotes,
    clients,
    selectedStatus,
    selectedClient,
    selectedNoteId,
    setSelectedStatus,
    setSelectedClient,
    setSelectedNoteId,
    handleAssign,
    handlePayment,
    handleNewPromissory
  };
}
