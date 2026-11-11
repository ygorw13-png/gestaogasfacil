
export interface PromissoryNote {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  value: number;
  dueDate: Date;
  status: PromissoryStatus;
  createdAt: Date;
  assignedTo?: string;
  /** ID do cobrador (G1). */
  cobradorId?: string;
  /** Total já recebido (pagamentos parciais somados). */
  paidAmount: number;
  /** value - paidAmount (nunca negativo). */
  saldo: number;
  /** Venda de origem (vazio = promissória manual). */
  orderId?: string;
  paidAt?: Date;
}

export type PromissoryStatus = "pending" | "assigned" | "paid" | "overdue" | "parcial" | "cancelled";

export interface PromissoryClient {
  id: string;
  name: string;
  totalPromissoryValue: number;
  paidPromissoryCount: number;
  pendingPromissoryCount: number;
  lastPurchaseDate?: Date;
}

export interface PromissoryCollector {
  id: string;
  name: string;
  assignedCount: number;
}
