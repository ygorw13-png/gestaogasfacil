
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PromissoryNote, PromissoryStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function usePromissoryNotes() {
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromissoryNotes();
  }, []);

  const fetchPromissoryNotes = async () => {
    try {
      // Por enquanto vamos continuar com os dados mocados
      // Em uma implementação real, aqui faríamos uma chamada ao Supabase
      // Quando a tabela de promissórias for criada
      
      // Usar dados mockados por enquanto
      import('../data/mockData').then(({ mockPromissoryNotes }) => {
        setPromissoryNotes(mockPromissoryNotes);
        setLoading(false);
      });
    } catch (error) {
      console.error("Erro ao buscar promissórias:", error);
      setLoading(false);
    }
  };

  // Filtrar notas com base no status e cliente selecionados
  const filteredNotes = promissoryNotes.filter(note => {
    const statusMatch = selectedStatus === 'all' || note.status === selectedStatus;
    const clientMatch = selectedClient === 'all' || note.clientName === selectedClient;
    return statusMatch && clientMatch;
  });

  // Separar as notas por status
  const pendingNotes = filteredNotes.filter(
    note => note.status === "pending" || note.status === "overdue"
  );
  const assignedNotes = filteredNotes.filter(note => note.status === "assigned");
  const paidNotes = filteredNotes.filter(note => note.status === "paid");

  // Extrair lista única de clientes para o filtro
  const clients = [...new Set(promissoryNotes.map(note => note.clientName))];

  const addPromissoryNote = (note: Omit<PromissoryNote, 'id' | 'createdAt'>) => {
    const newNote: PromissoryNote = {
      id: (Math.random() * 1000).toFixed(0),
      clientName: note.clientName,
      value: note.value,
      dueDate: note.dueDate,
      status: note.status || 'pending',
      createdAt: new Date(),
      assignedTo: note.assignedTo
    };

    setPromissoryNotes([newNote, ...promissoryNotes]);
    toast({
      title: "Promissória Adicionada",
      description: `Promissória de R$ ${note.value.toFixed(2)} para ${note.clientName} registrada com sucesso.`
    });
  };

  const handleAssign = (collector: string) => {
    if (selectedNoteId) {
      setPromissoryNotes(
        promissoryNotes.map((note) => {
          if (note.id === selectedNoteId) {
            return {
              ...note,
              status: 'assigned' as PromissoryStatus,
              assignedTo: collector,
            };
          }
          return note;
        })
      );

      toast({
        title: "Promissória Atribuída",
        description: `Promissória atribuída a ${collector} com sucesso.`
      });
    }
  };

  const handlePayment = (amount: number, method: string) => {
    if (selectedNoteId) {
      setPromissoryNotes(
        promissoryNotes.map((note) => {
          if (note.id === selectedNoteId) {
            return {
              ...note,
              status: 'paid' as PromissoryStatus,
              paidAt: new Date()
            };
          }
          return note;
        })
      );

      toast({
        title: "Promissória Paga",
        description: "Promissória marcada como paga com sucesso."
      });
    }
  };

  const handleNewPromissory = (data: {
    clientName: string;
    value: number;
    dueDate: Date;
    collector: string | null;
  }) => {
    addPromissoryNote({
      clientName: data.clientName,
      value: data.value,
      dueDate: data.dueDate,
      status: data.collector ? 'assigned' : 'pending',
      assignedTo: data.collector || undefined
    });
  };

  return {
    promissoryNotes,
    loading,
    addPromissoryNote,
    assignPromissoryNote: (id: string, collector: string) => {
      setSelectedNoteId(id);
      handleAssign(collector);
    },
    markPromissoryAsPaid: (id: string) => {
      setSelectedNoteId(id);
      handlePayment(0, "");
    },
    notes: promissoryNotes,
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
