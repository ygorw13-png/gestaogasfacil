
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PromissoryNote } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function usePromissoryNotes() {
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromissoryNotes();
  }, []);

  const fetchPromissoryNotes = async () => {
    try {
      // Por enquanto vamos continuar com os dados mocados
      // Em uma implementação real, aqui fariamos uma chamada ao Supabase
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

  const assignPromissoryNote = (id: string, collector: string) => {
    setPromissoryNotes(
      promissoryNotes.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            status: 'assigned',
            assignedTo: collector,
            assignedAt: new Date()
          };
        }
        return note;
      })
    );

    toast({
      title: "Promissória Atribuída",
      description: `Promissória atribuída a ${collector} com sucesso.`
    });
  };

  const markPromissoryAsPaid = (id: string) => {
    setPromissoryNotes(
      promissoryNotes.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            status: 'paid',
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
  };

  return {
    promissoryNotes,
    loading,
    addPromissoryNote,
    assignPromissoryNote,
    markPromissoryAsPaid
  };
}
