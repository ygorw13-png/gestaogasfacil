
export interface Sale {
  id: number | string;
  /** Chave de reenvio da ação controlada (a mesma até a venda ser confirmada). */
  chave?: string;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  amount: number;
  productCode?: 'p13' | 'p20' | 'p45' | 'water' | 'vasilhame_p13';
  tipoVenda?: 'completa' | 'recarga' | 'vasilhame';
  clientId?: string | null;
  cylinderMovement?: 'none' | 'loan' | 'return';
  movementQuantity?: number;
}


export interface NewSaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Com as ações controladas devolve se gravou (false = formulário continua aberto). */
  onSubmit: (sale: Sale) => void | Promise<boolean>;
}
