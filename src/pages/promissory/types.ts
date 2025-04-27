
export type PromissoryStatus = "pending" | "assigned" | "paid" | "overdue";

export interface PromissoryNote {
  id: string;
  clientName: string;
  value: number;
  dueDate: Date;
  status: PromissoryStatus;
  createdAt: Date;
  paidAt?: Date;
  assignedTo?: string;
}
