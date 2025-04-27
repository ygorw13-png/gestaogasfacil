
export interface PaymentHistoryItem {
  date: Date;
  amount: number;
  method: string;
}

export interface PromissoryNote {
  id: number;
  clientName: string;
  value: number;
  dueDate: Date;
  status: 'pending' | 'assigned' | 'paid' | 'overdue';
  collector: string | null;
  paymentHistory: PaymentHistoryItem[];
}
