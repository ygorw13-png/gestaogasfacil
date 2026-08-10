
import { useReducer, useCallback } from "react";
import type { Sale } from "../types/saleTypes";
import type { Reseller } from "../../resellers/types";
import { useRegistrarEntregaConta } from "@/hooks/useContaBotijoes";

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
  product: "",
  quantity: 1,
  unitPrice: 120,
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
export const useSaleForm = (onSubmit: (sale: Sale) => void, onOpenChange: (open: boolean) => void) => {
  const [state, dispatch] = useReducer(saleFormReducer, initialState);
  const registrarEntrega = useRegistrarEntregaConta();
  
  // Effect to update price when reseller or product changes
  // Since we're using a reducer, we can handle this in the reducer
  // or via a separate useEffect if needed
  
  // Handle product change with appropriate price updates
  const setProduct = useCallback((product: string) => {
    dispatch({ type: 'SET_PRODUCT', payload: product });
    
    // Update price based on product and reseller
    if (state.saleType === "reseller" && state.selectedReseller && product) {
      const prices: Record<string, number> = {
        p13: state.selectedReseller.priceP13,
        p20: state.selectedReseller.priceP20,
        p45: state.selectedReseller.priceP45,
        water: state.selectedReseller.priceWater,
      };
      
      dispatch({ type: 'SET_UNIT_PRICE', payload: prices[product] || 120 });
    }
  }, [state.saleType, state.selectedReseller]);

  // Handle reseller change with price updates
  const setSelectedReseller = useCallback((reseller: Reseller | null) => {
    dispatch({ type: 'SET_RESELLER', payload: reseller });
    
    // Update price if product is selected
    if (reseller && state.product) {
      const prices: Record<string, number> = {
        p13: reseller.priceP13,
        p20: reseller.priceP20,
        p45: reseller.priceP45,
        water: reseller.priceWater,
      };
      
      dispatch({ type: 'SET_UNIT_PRICE', payload: prices[state.product] || 120 });
    }
  }, [state.product]);

  // Função para lidar com o envio do formulário
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const isReseller = state.saleType === "reseller";

    const isVasilhame = state.product === 'vasilhame_p13';
    const isPonto = !isReseller && state.selectedClient?.origem === 'ponto';
    const isPontoAPrazo = isPonto && (state.paymentMethod === 'promissory' || !state.paymentMethod);
    const tipoVenda: 'completa' | 'recarga' | 'vasilhame' = isVasilhame
      ? 'vasilhame'
      : state.cylinderMovement === 'return'
      ? 'recarga'
      : 'completa';

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
      payment: isReseller ? 'Promissória' :
              state.paymentMethod === 'cash' ? 'Dinheiro' :
              state.paymentMethod === 'credit' ? 'Crédito' :
              state.paymentMethod === 'debit' ? 'Débito' :
              state.paymentMethod === 'pix' ? 'PIX' :
              state.paymentMethod === 'promissory' ? 'Promissória' :
              state.paymentMethod === 'gasVoucher' ? 'Vale Gás' : 'Convênio',
      // Venda para agregado/ponto em promissória não tem valor no ato: preço é definido no acerto
      amount: isReseller || isPontoAPrazo ? 0 : state.quantity * state.unitPrice,
      productCode: state.product as 'p13' | 'p20' | 'p45' | 'water' | 'vasilhame_p13',
      tipoVenda,
      clientId: state.selectedClient?.id ? String(state.selectedClient.id) : null,
      cylinderMovement: state.loanGas ? 'loan' : state.cylinderMovement,
      movementQuantity: state.loanGas ? state.quantity : state.movementQuantity,
    };


    // Agregado: lança na conta de botijões (acerto por quantidade)
    if (isReseller && state.selectedReseller) {
      registrarEntrega.mutate({
        parceiro_tipo: "agregado",
        parceiro_id: state.selectedReseller.id,
        parceiro_nome: state.selectedReseller.name,
        produto: state.product ? state.product.toUpperCase() : "P13",
        quantidade: state.quantity,
        vasilhames_recebidos: state.cylinderMovement === "return" ? state.movementQuantity : 0,
        observacoes: "Venda na portaria - a acertar",
      });
    }

    // Ponto de revenda que retirou na portaria: lança na ficha do ponto
    if (isPonto && !isVasilhame && state.selectedClient) {
      registrarEntrega.mutate({
        parceiro_tipo: "ponto",
        parceiro_id: String(state.selectedClient.id),
        parceiro_nome: String(state.selectedClient.name).replace(/\s*\(.*\)$/, ""),
        produto: state.product ? state.product.toUpperCase() : "P13",
        quantidade: state.quantity,
        vasilhames_recebidos: state.cylinderMovement === "return" ? state.movementQuantity : 0,
        observacoes: isPontoAPrazo
          ? "Retirada na portaria - a acertar"
          : "Retirada na portaria",
      });
    }



    // Reset the form
    dispatch({ type: 'RESET_FORM' });
    onSubmit(newSale);
    onOpenChange(false);
  }, [
    state,
    onSubmit,
    onOpenChange,
    registrarEntrega
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
    resetForm
  };
};
