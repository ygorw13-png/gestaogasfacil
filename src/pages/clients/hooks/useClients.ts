import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  addressObj?: any;
  cylinderCount: number;
  cylinderTypes: string[];
  loanDate: string;
  notes: string;
}

function formatAddress(a: any): string {
  if (!a) return "";
  if (typeof a === "string") return a;
  const parts = [
    a.street && `${a.street}${a.number ? `, ${a.number}` : ""}`,
    a.complement,
    a.neighborhood,
    a.city,
  ].filter(Boolean);
  return parts.join(" - ");
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isCylinderDialogOpen, setIsCylinderDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false);
  const [newCylinders, setNewCylinders] = useState<{ type: string; quantity: number }[]>([
    { type: "P13", quantity: 1 },
  ]);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const [clientsRes, cascosRes] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("cascos_emprestados").select("cliente_id, tipo_vasilhame, quantidade, data_emprestimo, status"),
    ]);
    if (clientsRes.error) {
      toast({ title: "Erro ao carregar clientes", description: clientsRes.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const cascos = cascosRes.data || [];
    const mapped: Client[] = (clientsRes.data || []).map((c: any) => {
      const ativos = cascos.filter((x: any) => x.cliente_id === c.id && x.status === "emprestado");
      const types: string[] = [];
      let count = 0;
      let lastDate = "";
      ativos.forEach((x: any) => {
        count += x.quantidade || 0;
        for (let i = 0; i < (x.quantidade || 0); i++) types.push(x.tipo_vasilhame);
        if (!lastDate || x.data_emprestimo > lastDate) lastDate = x.data_emprestimo;
      });
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        address: formatAddress(c.address),
        addressObj: c.address,
        cylinderCount: count,
        cylinderTypes: types,
        loanDate: lastDate || c.created_at,
        notes: c.notes || "",
      };
    });
    setClients(mapped);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clientsWithManyLoans = clients.filter((c) => c.cylinderCount >= 3);

  const handleAddNewClient = () => { fetchClients(); };

  const handleAddCylinders = async () => {
    if (!selectedClient) return;
    const { data: org } = await supabase.from("profiles").select("organization_id").eq("id", (await supabase.auth.getUser()).data.user?.id || "").single();
    const orgId = org?.organization_id;
    const me = (await supabase.auth.getUser()).data.user?.id;
    if (!orgId || !me) {
      toast({ title: "Sessão inválida", variant: "destructive" });
      return;
    }
    const rows = newCylinders
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        cliente_id: selectedClient.id,
        tipo_cliente: "cliente",
        tipo_vasilhame: c.type,
        quantidade: c.quantity,
        organization_id: orgId,
        registrado_por: me,
      }));
    if (rows.length === 0) {
      toast({ title: "Adicione ao menos 1 vasilhame", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("cascos_emprestados").insert(rows);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Comodato registrado", description: `Vasilhames adicionados para ${selectedClient.name}` });
    setIsCylinderDialogOpen(false);
    setNewCylinders([{ type: "P13", quantity: 1 }]);
    fetchClients();
  };

  const handleReturnCylinders = async (clientId: string) => {
    const { error } = await supabase
      .from("cascos_emprestados")
      .update({ status: "devolvido", data_devolucao: new Date().toISOString().split("T")[0] })
      .eq("cliente_id", clientId)
      .eq("status", "emprestado");
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Devolução registrada" });
    fetchClients();
  };

  const handleGenerateReport = () => {
    toast({ title: "Use o botão 'Gerar Relatório' dentro da lista para baixar o Excel." });
  };

  const handleViewClientDetails = (client: Client) => {
    setSelectedClient(client);
    setIsClientDetailOpen(true);
  };

  return {
    clients, setClients, loading,
    searchTerm, setSearchTerm,
    isNewClientDialogOpen, setIsNewClientDialogOpen,
    isAlertDialogOpen, setIsAlertDialogOpen,
    isCylinderDialogOpen, setIsCylinderDialogOpen,
    selectedClient, setSelectedClient,
    isClientDetailOpen, setIsClientDetailOpen,
    newCylinders, setNewCylinders,
    filteredClients, clientsWithManyLoans,
    handleAddNewClient, handleAddCylinders, handleReturnCylinders,
    handleGenerateReport, handleViewClientDetails,
    refresh: fetchClients,
  };
}
