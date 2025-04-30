
export interface PromissoryNote {
  id: string;
  clientName: string;
  value: number;
  dueDate: Date;
  status: PromissoryStatus;
  createdAt: Date;
  assignedTo?: string;
  paidAt?: Date;
}

export type PromissoryStatus = "pending" | "assigned" | "paid" | "overdue";

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
