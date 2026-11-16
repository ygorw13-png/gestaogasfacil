
import { useReducer, useCallback, useRef, useState } from "react";
import type { Sale } from "../types/saleTypes";
import type { Reseller } from "../../resellers/types";
import { infoForma, valorParaForma, FORMA_AGREGADO, ROTULO_AGREGADO, type FormaPagamento } from "@/lib/formasPagamento";

/**
 * Venda Regular da portaria: grava sempre o total informado, inclusive para cliente cadastrado como
 * ponto de revenda (ser ponto não zera o valor). Nota promissória exige cliente e total positivo.
 * Retirada de parceiro "a acertar" (sem valor) é só a aba de agregado (ação retirada_agregado, candidato 017).
 * O id de um ponto não é de `clients`: vai só o nome, para a promissória não ser recusada.
 */
export function dadosVendaRegular(p: {
  forma: FormaPagamento;
  total: number;
  cliente: { id: string | number; origem?: "cliente" | "ponto" } | null;
}): { valor: number | null; clientId: string | null } {
  if (p.forma === "promissoria" && !p.cliente) throw new Error("Selecione o cliente para venda em Nota promissória.");
  const valor = valorParaForma(p.forma, Number.isFinite(p.total) && p.total > 0 ? p.total : null);
  const clientId = p.cliente && p.cliente.origem !== "ponto" ? String(p.cliente.id) : null;
  return { valor, clientId };
}

// Define action types
type SaleFormAction =
  | { type: 'SET_SALE_TYPE', payload: 'regular' | 'reseller' }
  | { type: 'SET_CLIENT', payload: any | null }
  | { type: 'SET_RESELLER', payload: Reseller | null }
  | { type: 'SET_PAYMENT_METHOD', payload: string }
  | { type: 'SET_PRODUCT', payload: string }
  | { type: 'SET_QUANTITY', payload: number }
  | { type: 'SET_UNIT_PRICE', payload: number }
  | { type: 'SET_LOAN_GAS', payload: boolean }
  | { type: 'SET_CYLINDER_MOVEMENT', payload: 'none' | 'loan' | 'return' }
  | { type: 'SET_MOVEMENT_QUANTITY', payload: number }
  | { type: 'RESET_FORM' };

// Define state type
interface SaleFormState {
  saleType: 'regular' | 'reseller';
  selectedClient: any | null;
  selectedReseller: Reseller | null;
  paymentMethod: string;
  product: string;
  quantity: number;
  unitPrice: number;
  loanGas: boolean;
  cylinderMovement: 'none' | 'loan' | 'return';
  movementQuantity: number;
}

// Initial state
const initialState: SaleFormState = {
  saleType: "regular",
  selectedClient: null,
  selectedReseller: null,
  paymentMethod: "",
  product: "p13",
  quantity: 1,
  unitPrice: 0,
  loanGas: false,
  cylinderMovement: 'none',
  movementQuantity: 1
};

// Reducer function
function saleFormReducer(state: SaleFormState, action: SaleFormAction): SaleFormState {
  switch (action.type) {
    case 'SET_SALE_TYPE':
      return { ...state, saleType: action.payload };
    case 'SET_CLIENT':
      return { ...state, selectedClient: action.payload };
    case 'SET_RESELLER':
      return { ...state, selectedReseller: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_PRODUCT':
      return { ...state, product: action.payload };
    case 'SET_QUANTITY':
      return { ...state, quantity: action.payload };
    case 'SET_UNIT_PRICE':
      return { ...state, unitPrice: action.payload };
    case 'SET_LOAN_GAS':
      return { ...state, loanGas: action.payload };
    case 'SET_CYLINDER_MOVEMENT':
      return { ...state, cylinderMovement: action.payload };
    case 'SET_MOVEMENT_QUANTITY':
      return { ...state, movementQuantity: action.payload };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

// Custom hook
export const useSaleForm = (onSubmit: (sale: Sale) => void | Promise<void>, onOpenChange: (open: boolean) => void) => {
  const [state, dispatch] = useReducer(saleFormReducer, initialState);
  // Trava imediata contra envio duplo (o estado do React só atualiza no próximo render).
  const enviandoRef = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // Effect to update price when reseller or product changes
  // Since we're using a reducer, we can handle this in the reducer
  // or via a separate useEffect if needed
  
  // Agregado: o preço é sigiloso (só administrador, no acerto); a portaria registra só a quantidade.
  const setProduct = useCallback((product: string) => {
    dispatch({ type: 'SET_PRODUCT', payload: product });
  }, []);

  const setSelectedReseller = useCallback((reseller: Reseller | null) => {
    dispatch({ type: 'SET_RESELLER', payload: reseller });
  }, []);

  // Função para lidar com o envio do formulário.
  // Só limpa, fecha e dispara efeitos ligados à venda DEPOIS da gravação confirmada; em falha,
  // mantém tudo preenchido para nova tentativa.
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current) return;

    const isReseller = state.saleType === "reseller";

    const isVasilhame = state.product === 'vasilhame_p13';
    // Padrão da portaria: o cliente traz o casco vazio (troca) => "recarga".
    // Só é "completa" quando o casco sai da empresa (empréstimo/comodato).
    const levaCasco = state.loanGas || state.cylinderMovement === 'loan';
    const tipoVenda: 'completa' | 'recarga' | 'vasilhame' = isVasilhame
      ? 'vasilhame'
      : levaCasco
      ? 'completa'
      : 'recarga';

    // Forma escolhida -> código único (o mesmo gravado no banco). Sem forma válida, não registra:
    // nunca cai em "Convênio" ou outra modalidade por omissão.
    if (isReseller && !state.selectedReseller) {
      setErro("Selecione o agregado.");
      return;
    }
    const forma = isReseller ? null : infoForma(state.paymentMethod);
    if (!isReseller && !forma) {
      setErro("Selecione a forma de pagamento.");
      return;
    }
    const total = state.quantity * state.unitPrice;
    // Agregado (aba própria): retirada "a acertar", sem valor (o preço não chega ao navegador).
    let valor: number | null = null;
    let clientId: string | null = null;
    if (!isReseller) {
      try {
        ({ valor, clientId } = dadosVendaRegular({ forma: forma.codigo, total, cliente: state.selectedClient ?? null }));
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Valor inválido.");
        return;
      }
    }

    const newSale: Sale = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      client: isReseller
        ? state.selectedReseller?.name ?? "Agregado"
        : state.selectedClient ? state.selectedClient.name : "Venda Avulsa",
      product: state.product === 'p13' ? 'GLP P13' : 
              state.product === 'p20' ? 'GLP P20' :
              state.product === 'p45' ? 'GLP P45' :
              isVasilhame ? 'Vasilhame P13' : 'Água 20L',
      quantity: state.quantity,
      payment: forma ? forma.rotulo : ROTULO_AGREGADO,
      paymentCode: forma ? forma.codigo : FORMA_AGREGADO,
      amount: valor ?? 0,
      valorInformado: valor !== null,
      resellerId: isReseller ? state.selectedReseller!.id : null,
      productCode: state.product as 'p13' | 'p20' | 'p45' | 'water' | 'vasilhame_p13',
      tipoVenda,
      clientId,
      cylinderMovement: state.loanGas ? 'loan' : state.cylinderMovement,
      movementQuantity: state.loanGas ? state.quantity : state.movementQuantity,
    };

    enviandoRef.current = true;
    setEnviando(true);
    setErro(null);
    try {
      await onSubmit(newSale);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível registrar a venda. Os dados foram mantidos.");
      return;
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }

    // ── gravação confirmada ──
    // Agregado: a conta quantitativa é a própria retirada (mesmo pedido, gravado junto no banco).
    // Venda Regular (com ponto ou não) já foi cobrada pela própria venda/promissória:
    // não lança dívida de botijões na ficha do parceiro (evita cobrança duplicada).

    dispatch({ type: 'RESET_FORM' });
    onOpenChange(false);
  }, [
    state,
    onSubmit,
    onOpenChange,
  ]);

  // Reset form function
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  return {
    // State values
    saleType: state.saleType,
    selectedClient: state.selectedClient,
    selectedReseller: state.selectedReseller,
    paymentMethod: state.paymentMethod,
    product: state.product, 
    quantity: state.quantity,
    unitPrice: state.unitPrice,
    loanGas: state.loanGas,
    cylinderMovement: state.cylinderMovement,
    movementQuantity: state.movementQuantity,
    
    // State setters
    setSaleType: (type: 'regular' | 'reseller') => dispatch({ type: 'SET_SALE_TYPE', payload: type }),
    setSelectedClient: (client: any) => dispatch({ type: 'SET_CLIENT', payload: client }),
    setSelectedReseller,
    setPaymentMethod: (method: string) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: method }),
    setProduct,
    setQuantity: (qty: number) => dispatch({ type: 'SET_QUANTITY', payload: qty }),
    setUnitPrice: (price: number) => dispatch({ type: 'SET_UNIT_PRICE', payload: price }),
    setLoanGas: (loan: boolean) => dispatch({ type: 'SET_LOAN_GAS', payload: loan }),
    setCylinderMovement: (movement: 'none' | 'loan' | 'return') => 
      dispatch({ type: 'SET_CYLINDER_MOVEMENT', payload: movement }),
    setMovementQuantity: (qty: number) => dispatch({ type: 'SET_MOVEMENT_QUANTITY', payload: qty }),
    
    // Actions
    handleSubmit,
    resetForm,
    enviando,
    erro
  };
};
