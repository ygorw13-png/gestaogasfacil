/**
 * Regras de tela do fluxo de entregas (SQL 012). Módulo puro, sem rede.
 * O banco tem as mesmas regras: `_eh_entrega`, `_entrega_data`, `entrega_motivo_revisao`.
 */
import { dataOperacional } from "@/lib/dataOperacional";

/** Número curto do pedido, igual nas três telas (Pedidos, portaria e aplicativo do entregador). */
export const numeroPedido = (id: string) => `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** Modalidade pelo campo existente `origem_venda`: só pedido/online é entrega. Balcão, retirada e rua não. */
export const ehEntrega = (origem?: string | null) => origem === "pedido" || origem === "online";

const FECHADOS = ["completed", "delivered", "cancelled"];
export const entregaAberta = (status?: string | null) => !FECHADOS.includes(status ?? "pending");

/** Data da entrega: a prevista, quando existe; senão o dia (America/Bahia) em que o pedido foi criado. */
export function dataEntrega(prevista: string | null | undefined, criadoEm: Date | string): string {
  if (prevista) return prevista.slice(0, 10);
  return dataOperacional(typeof criadoEm === "string" ? new Date(criadoEm) : criadoEm);
}

export type Janela = "hoje" | "atrasada" | "agendada";
export function janelaEntrega(data: string, hoje: string): Janela {
  return data < hoje ? "atrasada" : data > hoje ? "agendada" : "hoje";
}

export interface DadosEntrega {
  status: string;
  deliveryPersonId?: string | null;
  deliveryPerson?: string | null;
  acceptedAt?: Date | string | null;
  rejectionReason?: string | null;
}

/** Motivo de "Revisão necessária" (null = vínculos suficientes). Só para entregas abertas. */
export function motivoRevisao(o: DadosEntrega): string | null {
  if (!entregaAberta(o.status)) return null;
  if (!["pending", "assigned", "delivering"].includes(o.status)) return `Situação antiga não reconhecida (${o.status})`;
  if (!o.deliveryPersonId && (o.deliveryPerson ?? "").trim()) return "Entregador registrado sem conta identificada no aplicativo";
  if ((o.status === "assigned" || o.status === "delivering") && !o.deliveryPersonId) return "Em andamento sem entregador identificado";
  if (o.status === "delivering" && !o.acceptedAt) return "Em rota sem aceite registrado pelo entregador";
  return null;
}

export type EstadoEntrega = "aguardando_atribuicao" | "recusada" | "aguardando_aceite" | "em_rota" | "entregue" | "cancelada" | "revisao";

export function estadoEntrega(o: DadosEntrega): EstadoEntrega {
  if (o.status === "cancelled") return "cancelada";
  if (o.status === "completed" || o.status === "delivered") return "entregue";
  if (motivoRevisao(o)) return "revisao";
  if (o.status === "assigned") return "aguardando_aceite";
  if (o.status === "delivering") return "em_rota";
  return o.rejectionReason ? "recusada" : "aguardando_atribuicao";
}

export const ROTULO_ESTADO: Record<EstadoEntrega, string> = {
  aguardando_atribuicao: "Aguardando atribuição",
  recusada: "Recusada — aguardando nova atribuição",
  aguardando_aceite: "Aguardando aceite",
  em_rota: "Aceita / em rota",
  entregue: "Entregue",
  cancelada: "Cancelada",
  revisao: "Revisão necessária",
};

/** Ações permitidas na lista de Pedidos para cada estado. */
export function acoesEntrega(o: DadosEntrega, isAdmin: boolean) {
  const e = estadoEntrega(o);
  return {
    atribuir: e === "aguardando_atribuicao" || e === "recusada",
    reatribuir: e === "aguardando_aceite" || e === "em_rota",
    concluir: e === "aguardando_aceite" || e === "em_rota",
    regularizar: e === "revisao" && isAdmin,
  };
}
