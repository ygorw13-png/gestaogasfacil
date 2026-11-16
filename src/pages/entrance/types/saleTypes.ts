
export interface Sale {
  id: number | string;
  time: string;
  client: string;
  product: string;
  quantity: number;
  payment: string;
  /** Código único da forma (src/lib/formasPagamento.ts). */
  paymentCode?: string;
  amount: number;
  /** false = valor não informado (vale-gás, Gás do Povo, convênio); grava NULL, não zero. */
  valorInformado?: boolean;
  productCode?: 'p13' | 'p20' | 'p45' | 'water' | 'vasilhame_p13';
  tipoVenda?: 'completa' | 'recarga' | 'vasilhame';
  clientId?: string | null;
  /** Retirada de agregado (sem valor): id do agregado. */
  resellerId?: string | null;
  cylinderMovement?: 'none' | 'loan' | 'return';
  movementQuantity?: number;
}


export interface NewSaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolve após a gravação confirmada; rejeita em falha. */
  onSubmit: (sale: Sale) => void | Promise<void>;
}
