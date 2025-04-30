
import { useState, useEffect } from "react";
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
    fetchPromissoryNotes();
  }, []);

  const fetchPromissoryNotes = async (): Promise<void> => {
    try {
      // Por enquanto vamos continuar com os dados mocados
      // Em uma implementação real, aqui faríamos uma chamada ao Supabase
      // Quando a tabela de promissórias for criada
      
      // Usar dados mockados por enquanto
      const { mockPromissoryNotes } = await import('../data/mockData');
      setPromissoryNotes(mockPromissoryNotes);
      
      // Atualizar dados do dashboard
      updateDashboardData(mockPromissoryNotes);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar promissórias:", error);
      setLoading(false);
    }
  };
  
  // Atualizar dados do dashboard com base nas promissórias
  const updateDashboardData = (notes: PromissoryNote[]): void => {
    const pendingNotes = notes.filter(note => note.status === "pending" || note.status === "overdue");
    const pendingValue = pendingNotes.reduce((sum, note) => sum + note.value, 0);
    
    // Atualizar os dados do dashboard
    overviewData.promissoryNotes = pendingNotes.length;
    overviewData.promissoryValue = `R$ ${pendingValue.toFixed(2).replace('.', ',')}`;
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

  const addPromissoryNote = (note: Omit<PromissoryNote, 'id' | 'createdAt'>): void => {
    const newNote: PromissoryNote = {
      id: (Math.random() * 1000).toFixed(0),
      clientName: note.clientName,
      value: note.value,
      dueDate: note.dueDate,
      status: note.status || 'pending',
      createdAt: new Date(),
      assignedTo: note.assignedTo
    };

    const updatedNotes = [newNote, ...promissoryNotes];
    setPromissoryNotes(updatedNotes);
    
    // Atualizar dados do dashboard
    updateDashboardData(updatedNotes);
    
    toast({
      title: "Promissória Adicionada",
      description: `Promissória de R$ ${note.value.toFixed(2)} para ${note.clientName} registrada com sucesso.`
    });
  };

  const handleAssign = (collector: string): void => {
    if (selectedNoteId) {
      const updatedNotes = promissoryNotes.map((note) => {
        if (note.id === selectedNoteId) {
          return {
            ...note,
            status: 'assigned' as PromissoryStatus,
            assignedTo: collector,
          };
        }
        return note;
      });
      
      setPromissoryNotes(updatedNotes);
      
      // Atualizar dados do dashboard
      updateDashboardData(updatedNotes);

      toast({
        title: "Promissória Atribuída",
        description: `Promissória atribuída a ${collector} com sucesso.`
      });
    }
  };

  const handlePayment = (amount: number, method: string): void => {
    if (selectedNoteId) {
      const updatedNotes = promissoryNotes.map((note) => {
        if (note.id === selectedNoteId) {
          return {
            ...note,
            status: 'paid' as PromissoryStatus,
            paidAt: new Date()
          };
        }
        return note;
      });
      
      setPromissoryNotes(updatedNotes);
      
      // Atualizar dados do dashboard
      updateDashboardData(updatedNotes);

      toast({
        title: "Promissória Paga",
        description: "Promissória marcada como paga com sucesso."
      });
    }
  };

  interface NewPromissoryData {
    clientName: string;
    value: number;
    dueDate: Date;
    collector: string | null;
  }

  const handleNewPromissory = (data: NewPromissoryData): void => {
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
