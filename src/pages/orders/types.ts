
export type OrderStatus = "pending" | "assigned" | "delivering" | "delivered" | "cancelled";

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
  assignedAt?: Date;
  deliveredAt?: Date;
  paymentMethod?: string;
  notes?: string;
  userId?: string; // Added userId as an optional property
};
