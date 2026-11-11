import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromissoryNote, PromissoryStatus } from "../types";
import { G1_ACOES, acao, formaRecebimento } from "@/lib/g1/acoes";
import { dataOperacional } from "@/lib/dataOperacional";
import type { Cobrador } from "./useCollectors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): PromissoryNote & { dueDateStr: string } {
  const value = Number(r.value) || 0;
  const paidAmount = Number(r.paid_amount) || 0;
  return {
    id: r.id,
    clientId: r.client_id || undefined,
    clientName: r.client_name,
    value,
    paidAmount,
    saldo: Math.max(0, value - paidAmount),
    // "AAAA-MM-DD" como data local (new Date("AAAA-MM-DD") seria meia-noite UTC = 21h do dia anterior em Bahia)
    dueDate: new Date(`${r.due_date}T12:00:00`),
    dueDateStr: String(r.due_date),
    status: (r.status as PromissoryStatus) || "pending",
    createdAt: new Date(r.created_at),
    assignedTo: r.assigned_to || undefined,
    cobradorId: r.cobrador_id || undefined,
    orderId: r.order_id || undefined,
    paidAt: r.paid_at ? new Date(r.paid_at) : undefined,
  };
}

export interface NovaPromissoria {
  clientName: string;
  value: number;
  /** "AAAA-MM-DD" */
  dueDate: string;
  cobrador: Cobrador | null;
  chave: string;
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
    // Buscar telefones dos clientes para contato via WhatsApp
    const { data: clientRows } = await supabase.from("clients").select("id, name, phone");
    // Agregados possuem menu próprio de acerto: não entram na gestão de promissórias
    const { data: resellerRows } = await supabase.from("resellers").select("name");
    const resellerNames = new Set(
      (resellerRows || []).map((r: any) => (r.name || "").toLowerCase().trim())
    );
    const byId = new Map<string, string>();
    const byName = new Map<string, string>();
    (clientRows || []).forEach((c: any) => {
      if (c.phone) {
        byId.set(c.id, c.phone);
        byName.set((c.name || "").toLowerCase().trim(), c.phone);
      }
    });

    // Vencida = vencimento ANTES de hoje (dia operacional, America/Bahia). No próprio dia ainda não venceu.
    const hoje = dataOperacional();
    const isExcluded = (name: string) => {
      const n = (name || "").toLowerCase().trim();
      return !n || n.includes("avulso") || n.includes("avulsa") || resellerNames.has(n);
    };
    const list = (data || []).map(mapRow).filter((n) => !isExcluded(n.clientName)).map((n) => {
      const phone =
        (n.clientId ? byId.get(n.clientId) : undefined) ??
        byName.get(n.clientName.toLowerCase().trim());
      const withPhone = { ...n, clientPhone: phone };
      if (withPhone.status === "pending" && withPhone.dueDateStr < hoje)
        return { ...withPhone, status: "overdue" as PromissoryStatus };
      return withPhone;
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

  // Parcial continua em aberto (antes não aparecia em aba nenhuma).
  const pendingNotes = useMemo(
    () => filteredNotes.filter((n) => n.status === "pending" || n.status === "overdue" || n.status === "parcial"),
    [filteredNotes]
  );
  const assignedNotes = useMemo(() => filteredNotes.filter((n) => n.status === "assigned"), [filteredNotes]);
  const paidNotes = useMemo(() => filteredNotes.filter((n) => n.status === "paid"), [filteredNotes]);
  const clients = useMemo(() => [...new Set(promissoryNotes.map((n) => n.clientName))], [promissoryNotes]);

  /** Atribui o cobrador (por ID). Lança em caso de erro (o diálogo mostra e mantém aberto). */
  const handleAssign = useCallback(
    async (cobrador: Cobrador) => {
      if (!selectedNoteId) return;
      if (G1_ACOES) {
        await acao("atribuir_cobrador", { _id: selectedNoteId, _cobrador_id: cobrador.id });
      } else {
        const { error } = await supabase
          .from("promissory_notes")
          .update({ status: "assigned", assigned_to: cobrador.nome })
          .eq("id", selectedNoteId);
        if (error) throw new Error(error.message);
      }
      toast({ title: "Promissória atribuída", description: `Atribuída a ${cobrador.nome}.` });
      fetch();
    },
    [selectedNoteId, toast, fetch]
  );

  /**
   * Recebimento (parcial ou total). Não é venda nova. `chave` vem do diálogo (presa ao conteúdo):
   * reenviar após resposta perdida não recebe duas vezes. `cobrador`: quem recebeu na rua (o dinheiro
   * fica com ele até prestar contas); sem cobrador, recebido na portaria. Lança em caso de erro.
   */
  const handlePayment = useCallback(
    async (amount: number, method: string, opts: { chave: string; cobrador?: Cobrador | null }) => {
      if (!selectedNoteId) return;
      const nota = promissoryNotes.find((n) => n.id === selectedNoteId);
      if (G1_ACOES) {
        const forma = formaRecebimento(method);
        if (!forma || forma === "promissoria") throw new Error(`"${method}" ainda não tem regra de recebimento (destino do valor a decidir).`);
        await acao("receber_promissoria", {
          _id: selectedNoteId, _valor: amount, _forma: forma, _chave: opts.chave, _cobrador_id: opts.cobrador?.id ?? null,
        });
      } else {
        // Caminho antigo: soma ao já pago e só quita quando cobre o valor (antes marcava "paga" com qualquer valor).
        const pago = (nota?.paidAmount ?? 0) + amount;
        const quitada = !!nota && pago >= nota.value;
        const { error } = await supabase
          .from("promissory_notes")
          .update({
            status: quitada ? "paid" : "parcial",
            paid_at: quitada ? new Date().toISOString() : null,
            paid_amount: pago,
            payment_method: method || null,
          })
          .eq("id", selectedNoteId);
        if (error) throw new Error(error.message);
      }
      toast({ title: "Recebimento registrado", description: `R$ ${amount.toFixed(2)} recebido.` });
      fetch();
    },
    [selectedNoteId, promissoryNotes, toast, fetch]
  );

  /** Promissória manual (sem venda no sistema). Não é venda nem recebimento. Lança em caso de erro. */
  const handleNewPromissory = useCallback(
    async (data: NovaPromissoria) => {
      if (G1_ACOES) {
        await acao("criar_promissoria_manual", {
          _cliente_id: null, _cliente_nome: data.clientName, _valor: data.value, _vencimento: data.dueDate,
          _cobrador_id: data.cobrador?.id ?? null, _observacoes: null, _chave: data.chave,
        });
      } else {
        const { error } = await supabase.from("promissory_notes").insert({
          client_name: data.clientName,
          value: data.value,
          due_date: data.dueDate,
          status: data.cobrador ? "assigned" : "pending",
          assigned_to: data.cobrador?.nome ?? null,
          notes: "Promissória manual (sem venda no sistema)",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        if (error) throw new Error(error.message);
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
    // Quitar sem valor nem forma não é recebimento comprovado: use o diálogo de recebimento.
    markPromissoryAsPaid: async () => { throw new Error("Registre o valor e a forma do recebimento."); },
    refresh: fetch,
  };
}
