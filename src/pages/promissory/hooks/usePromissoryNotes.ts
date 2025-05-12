
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { PromissoryNote, PromissoryStatus } from "../types";
import { overviewData } from "@/pages/dashboard/data";

export function usePromissoryNotes() {
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Fetching promissory notes...");
    fetchPromissoryNotes();
  }, []);

  const fetchPromissoryNotes = useCallback(async (): Promise<void> => {
    try {
      // Por enquanto vamos continuar com os dados mocados
      // Em uma implementação real, aqui faríamos uma chamada ao Supabase
      // Quando a tabela de promissórias for criada
      console.log("Loading mock promissory note data");
      const { mockPromissoryNotes } = await import('../data/mockData');
      setPromissoryNotes(mockPromissoryNotes);
      
      // Atualizar dados do dashboard
      updateDashboardData(mockPromissoryNotes);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar promissórias:", error);
      setLoading(false);
    }
  }, []);
  
  // Atualizar dados do dashboard com base nas promissórias
  const updateDashboardData = useCallback((notes: PromissoryNote[]): void => {
    const pendingNotes = notes.filter(note => note.status === "pending" || note.status === "overdue");
    const pendingValue = pendingNotes.reduce((sum, note) => sum + note.value, 0);
    
    // Atualizar os dados do dashboard
    overviewData.promissoryNotes = pendingNotes.length;
    overviewData.promissoryValue = `R$ ${pendingValue.toFixed(2).replace('.', ',')}`;
  }, []);

  // Filtrar notas com base no status e cliente selecionados - usando useMemo para otimização
  const filteredNotes = useMemo(() => {
    return promissoryNotes.filter(note => {
      const statusMatch = selectedStatus === 'all' || note.status === selectedStatus;
      const clientMatch = selectedClient === 'all' || note.clientName === selectedClient;
      return statusMatch && clientMatch;
    });
  }, [promissoryNotes, selectedStatus, selectedClient]);

  // Separar as notas por status - usando useMemo para evitar recálculos
  const pendingNotes = useMemo(() => {
    return filteredNotes.filter(
      note => note.status === "pending" || note.status === "overdue"
    );
  }, [filteredNotes]);
  
  const assignedNotes = useMemo(() => {
    return filteredNotes.filter(note => note.status === "assigned");
  }, [filteredNotes]);
  
  const paidNotes = useMemo(() => {
    return filteredNotes.filter(note => note.status === "paid");
  }, [filteredNotes]);

  // Extrair lista única de clientes para o filtro - usando useMemo
  const clients = useMemo(() => {
    return [...new Set(promissoryNotes.map(note => note.clientName))];
  }, [promissoryNotes]);

  const addPromissoryNote = useCallback((note: Omit<PromissoryNote, 'id' | 'createdAt'>): void => {
    const newNote: PromissoryNote = {
      id: (Math.random() * 1000).toFixed(0),
      clientName: note.clientName,
      value: note.value,
      dueDate: note.dueDate,
      status: note.status || 'pending',
      createdAt: new Date(),
      assignedTo: note.assignedTo
    };

    setPromissoryNotes(prevNotes => {
      const updatedNotes = [newNote, ...prevNotes];
      // Atualizar dados do dashboard
      updateDashboardData(updatedNotes);
      return updatedNotes;
    });
    
    toast({
      title: "Promissória Adicionada",
      description: `Promissória de R$ ${note.value.toFixed(2)} para ${note.clientName} registrada com sucesso.`
    });
  }, [toast, updateDashboardData]);

  const handleAssign = useCallback((collector: string): void => {
    if (selectedNoteId) {
      setPromissoryNotes(prevNotes => {
        const updatedNotes = prevNotes.map((note) => {
          if (note.id === selectedNoteId) {
            return {
              ...note,
              status: 'assigned' as PromissoryStatus,
              assignedTo: collector,
            };
          }
          return note;
        });
        
        // Atualizar dados do dashboard
        updateDashboardData(updatedNotes);
        
        return updatedNotes;
      });

      toast({
        title: "Promissória Atribuída",
        description: `Promissória atribuída a ${collector} com sucesso.`
      });
    }
  }, [selectedNoteId, toast, updateDashboardData]);

  const handlePayment = useCallback((amount: number, method: string): void => {
    if (selectedNoteId) {
      setPromissoryNotes(prevNotes => {
        const updatedNotes = prevNotes.map((note) => {
          if (note.id === selectedNoteId) {
            return {
              ...note,
              status: 'paid' as PromissoryStatus,
              paidAt: new Date()
            };
          }
          return note;
        });
        
        // Atualizar dados do dashboard
        updateDashboardData(updatedNotes);
        
        return updatedNotes;
      });

      toast({
        title: "Promissória Paga",
        description: "Promissória marcada como paga com sucesso."
      });
    }
  }, [selectedNoteId, toast, updateDashboardData]);

  interface NewPromissoryData {
    clientName: string;
    value: number;
    dueDate: Date;
    collector: string | null;
  }

  const handleNewPromissory = useCallback((data: NewPromissoryData): void => {
    addPromissoryNote({
      clientName: data.clientName,
      value: data.value,
      dueDate: data.dueDate,
      status: data.collector ? 'assigned' : 'pending',
      assignedTo: data.collector || undefined
    });
  }, [addPromissoryNote]);

  return {
    promissoryNotes,
    loading,
    addPromissoryNote,
    assignPromissoryNote: useCallback((id: string, collector: string) => {
      setSelectedNoteId(id);
      handleAssign(collector);
    }, [setSelectedNoteId, handleAssign]),
    markPromissoryAsPaid: useCallback((id: string) => {
      setSelectedNoteId(id);
      handlePayment(0, "");
    }, [setSelectedNoteId, handlePayment]),
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
