
export interface Sale {
  id: number;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  amount: number;
  productCode?: 'p13' | 'p20' | 'p45' | 'water';
  clientId?: string | null;
  cylinderMovement?: 'none' | 'loan' | 'return';
  movementQuantity?: number;
}

export interface NewSaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (sale: Sale) => void;
}
