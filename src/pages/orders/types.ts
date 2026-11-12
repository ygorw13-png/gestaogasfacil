
export type OrderStatus = "pending" | "assigned" | "delivering" | "delivered" | "completed" | "cancelled";

export type Order = {
  id: string;
  clientName: string;
  clientPhone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
  };
  product: string;
  quantity: number;
  price: number;
  hasEmptyCylinder: boolean;
  isCompletePackage: boolean;
  createdAt: Date;
  status: OrderStatus;
  deliveryPerson?: string;
  deliveryPersonName?: string;
  assignedAt?: Date;
  deliveredAt?: Date;
  paymentMethod?: string;
  notes?: string;
  tipoVenda?: "completa" | "recarga" | "vasilhame";
  /** Conta do entregador no app (fonte da atribuição). */
  deliveryPersonId?: string | null;
  acceptedAt?: Date;
  rejectionReason?: string | null;
  origemVenda?: string | null;
  /** Data prevista da entrega (AAAA-MM-DD); vazio = dia da criação. */
  entregaPrevista?: string | null;
  /** Data efetiva da entrega (prevista ou criação, em America/Bahia). */
  dataEntrega?: string;
  userId?: string; // Added userId as an optional property
};
