
export interface Sale {
  id: number;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  amount: number;
}

export interface NewSaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (sale: Sale) => void;
}
