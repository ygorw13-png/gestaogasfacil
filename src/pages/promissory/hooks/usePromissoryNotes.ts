import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromissoryNote, PromissoryStatus } from "../types";

function mapRow(r: any): PromissoryNote {
  return {
    id: r.id,
    clientName: r.client_name,
    value: Number(r.value),
    dueDate: new Date(r.due_date),
    status: (r.status as PromissoryStatus) || "pending",
    createdAt: new Date(r.created_at),
    assignedTo: r.assigned_to || undefined,
    paidAt: r.paid_at ? new Date(r.paid_at) : undefined,
  };
}

export function usePromissoryNotes() {
  const [promissoryNotes, setPromissoryNotes] = useState<PromissoryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promissory_notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar promissórias", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Marcar atrasadas no client-side
    const today = new Date();
    const list = (data || []).map(mapRow).map((n) => {
      if (n.status === "pending" && n.dueDate < today) return { ...n, status: "overdue" as PromissoryStatus };
      return n;
    });
    setPromissoryNotes(list);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetch(); }, [fetch]);

  const filteredNotes = useMemo(
    () =>
      promissoryNotes.filter((n) => {
        const s = selectedStatus === "all" || n.status === selectedStatus;
        const c = selectedClient === "all" || n.clientName === selectedClient;
        return s && c;
      }),
    [promissoryNotes, selectedStatus, selectedClient]
  );

  const pendingNotes = useMemo(
    () => filteredNotes.filter((n) => n.status === "pending" || n.status === "overdue"),
    [filteredNotes]
  );
  const assignedNotes = useMemo(() => filteredNotes.filter((n) => n.status === "assigned"), [filteredNotes]);
  const paidNotes = useMemo(() => filteredNotes.filter((n) => n.status === "paid"), [filteredNotes]);
  const clients = useMemo(() => [...new Set(promissoryNotes.map((n) => n.clientName))], [promissoryNotes]);

  const handleAssign = useCallback(
    async (collector: string) => {
      if (!selectedNoteId) return;
      const { error } = await supabase
        .from("promissory_notes")
        .update({ status: "assigned", assigned_to: collector })
        .eq("id", selectedNoteId);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Promissória atribuída", description: `Atribuída a ${collector}.` });
      fetch();
    },
    [selectedNoteId, toast, fetch]
  );

  const handlePayment = useCallback(
    async (amount: number, method: string) => {
      if (!selectedNoteId) return;
      const { error } = await supabase
        .from("promissory_notes")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_amount: amount || null,
          payment_method: method || null,
        })
        .eq("id", selectedNoteId);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Promissória paga" });
      fetch();
    },
    [selectedNoteId, toast, fetch]
  );

  const handleNewPromissory = useCallback(
    async (data: { clientName: string; value: number; dueDate: Date; collector: string | null }) => {
      const payload: any = {
        client_name: data.clientName,
        value: data.value,
        due_date: data.dueDate.toISOString().split("T")[0],
        status: data.collector ? "assigned" : "pending",
        assigned_to: data.collector || null,
      };
      const { error } = await supabase.from("promissory_notes").insert(payload);
      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Promissória criada", description: `R$ ${data.value.toFixed(2)} para ${data.clientName}` });
      fetch();
    },
    [toast, fetch]
  );

  return {
    promissoryNotes, loading,
    notes: promissoryNotes,
    filteredNotes, pendingNotes, assignedNotes, paidNotes, clients,
    selectedStatus, selectedClient, selectedNoteId,
    setSelectedStatus, setSelectedClient, setSelectedNoteId,
    handleAssign, handlePayment, handleNewPromissory,
    addPromissoryNote: handleNewPromissory,
    assignPromissoryNote: async (id: string, collector: string) => { setSelectedNoteId(id); await handleAssign(collector); },
    markPromissoryAsPaid: async (id: string) => { setSelectedNoteId(id); await handlePayment(0, ""); },
    refresh: fetch,
  };
}
