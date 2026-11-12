import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrderMutations } from "./useOrderMutations";
import { dataOperacional, somarDias } from "@/lib/dataOperacional";
import { dataEntrega, entregaAberta, janelaEntrega } from "@/lib/entregas";

/**
 * Filtros de Pedidos (fonte única das entregas):
 *  - operacional (padrão): entregas de hoje + atrasadas realmente abertas (não somem na virada do dia);
 *  - hoje / atrasadas / agendadas: pela data prevista (ou dia da criação, America/Bahia);
 *  - periodo: histórico pela data de criação.
 * Balcão, retirada e venda na rua (origem_venda portaria/rua) nunca entram como entrega.
 */
export type FiltroPedidos = "operacional" | "hoje" | "atrasadas" | "agendadas" | "periodo";

const ENTREGA = ["pedido", "online"];
const inicioDoDia = (d: string) => `${d}T00:00:00-03:00`;
const fimDoDia = (d: string) => `${d}T23:59:59.999-03:00`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatar(order: any, nomes: Map<string, string>, userId?: string): Order {
  const addr = (order.address && typeof order.address === "object" ? order.address : {}) as Record<string, unknown>;
  const pessoa = order.delivery_person_id || order.delivery_person;
  return {
    id: order.id,
    clientName: order.client_name,
    clientPhone: order.client_phone || "",
    address: {
      street: String(addr.street || ""),
      number: String(addr.number || ""),
      complement: addr.complement ? String(addr.complement) : "",
      neighborhood: addr.neighborhood ? String(addr.neighborhood) : "",
    },
    product: order.product || "",
    quantity: Number(order.quantity) || 0,
    price: Number(order.price) || 0,
    hasEmptyCylinder: Boolean(order.has_empty_cylinder),
    isCompletePackage: Boolean(order.is_complete_package),
    createdAt: new Date(order.created_at),
    status: order.status as OrderStatus,
    deliveryPerson: order.delivery_person,
    deliveryPersonId: order.delivery_person_id ?? null,
    deliveryPersonName: pessoa
      ? nomes.get(pessoa) ?? (order.delivery_person_id ? "Entregador" : "Cadastro antigo (sem conta no app)")
      : undefined,
    assignedAt: order.assigned_at ? new Date(order.assigned_at) : undefined,
    acceptedAt: order.accepted_at ? new Date(order.accepted_at) : undefined,
    deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
    rejectionReason: order.rejection_reason ?? null,
    origemVenda: order.origem_venda ?? null,
    entregaPrevista: order.entrega_prevista ?? null,
    dataEntrega: dataEntrega(order.entrega_prevista, order.created_at),
    paymentMethod: order.payment_method,
    tipoVenda: order.tipo_venda,
    notes: order.notes,
    userId,
  };
}

/** Nomes: conta do app (profiles) e, para registros antigos, o cadastro de colaborador gravado em texto. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function nomesDosEntregadores(rows: any[]) {
  const nomes = new Map<string, string>();
  const ids = Array.from(new Set(rows.flatMap((o) => [o.delivery_person_id, o.delivery_person]).filter((v): v is string => !!v && /^[0-9a-f-]{36}$/i.test(v))));
  if (ids.length === 0) return nomes;
  const [{ data: perfis }, { data: colabs }] = await Promise.all([
    supabase.from("profiles").select("id, name").in("id", ids),
    supabase.from("colaboradores").select("id, nome").in("id", ids),
  ]);
  colabs?.forEach((c) => nomes.set(c.id, `${c.nome} (cadastro antigo, sem conta no app)`));
  perfis?.forEach((p) => nomes.set(p.id, p.name));
  return nomes;
}

export function useOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [contagem, setContagem] = useState({ hoje: 0, atrasadas: 0, agendadas: 0 });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const hoje = dataOperacional();
  const [filtro, setFiltro] = useState<FiltroPedidos>("operacional");
  const [dateFrom, setDateFrom] = useState(hoje);
  const [dateTo, setDateTo] = useState(hoje);

  const orderMutations = useOrderMutations(orders, setOrders);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      const dia = dataOperacional();
      if (filtro === "periodo") {
        const { data, error } = await supabase.from("orders").select("*").in("origem_venda", ENTREGA)
          .gte("created_at", inicioDoDia(dateFrom)).lte("created_at", fimDoDia(dateTo))
          .order("created_at", { ascending: false });
        if (error) throw error;
        const nomes = await nomesDosEntregadores(data ?? []);
        setOrders((data ?? []).map((o) => formatar(o, nomes, user?.id)));
        return;
      }
      // Abertas de qualquer data + concluídas/canceladas cujo dia de entrega é hoje.
      const [abertas, doDia] = await Promise.all([
        supabase.from("orders").select("*").in("origem_venda", ENTREGA).not("status", "in", "(completed,delivered,cancelled)")
          .order("created_at", { ascending: true }),
        supabase.from("orders").select("*").in("origem_venda", ENTREGA).in("status", ["completed", "delivered", "cancelled"])
          .or(`entrega_prevista.eq.${dia},and(entrega_prevista.is.null,created_at.gte.${inicioDoDia(dia)},created_at.lte.${fimDoDia(dia)})`)
          .order("created_at", { ascending: false }),
      ]);
      if (abertas.error) throw abertas.error;
      if (doDia.error) throw doDia.error;
      const rows = [...(abertas.data ?? []), ...(doDia.data ?? [])];
      const nomes = await nomesDosEntregadores(rows);
      const todas = rows.map((o) => formatar(o, nomes, user?.id));
      const jan = (o: Order) => janelaEntrega(o.dataEntrega!, dia);
      const abertasF = todas.filter((o) => entregaAberta(o.status));
      setContagem({
        hoje: todas.filter((o) => jan(o) === "hoje").length,
        atrasadas: abertasF.filter((o) => jan(o) === "atrasada").length,
        agendadas: abertasF.filter((o) => jan(o) === "agendada").length,
      });
      const visiveis = todas.filter((o) => {
        const j = jan(o);
        if (filtro === "hoje") return j === "hoje";
        if (filtro === "atrasadas") return j === "atrasada" && entregaAberta(o.status);
        if (filtro === "agendadas") return j === "agendada" && entregaAberta(o.status);
        return j === "hoje" || (j === "atrasada" && entregaAberta(o.status));
      });
      // Atrasadas primeiro (mais antigas no topo), depois as de hoje das mais novas para as mais antigas
      visiveis.sort((a, b) => (a.dataEntrega! < b.dataEntrega! ? -1 : a.dataEntrega! > b.dataEntrega! ? 1 : b.createdAt.getTime() - a.createdAt.getTime()));
      setOrders(visiveis);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setErro("Não foi possível carregar os pedidos. A lista abaixo pode estar desatualizada.");
      toast({ title: "Erro ao buscar pedidos", description: "Não foi possível carregar os pedidos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filtro, dateFrom, dateTo, user?.id, toast]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  return {
    orders,
    loading: loading || orderMutations.loading,
    erro,
    fetchOrders,
    filtro,
    setFiltro,
    contagem,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    hoje,
    ontem: somarDias(hoje, -1),
    ...orderMutations,
  };
}
