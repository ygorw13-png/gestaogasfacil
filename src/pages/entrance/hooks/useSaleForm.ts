
import { useState, useEffect, useCallback } from "react";
import type { Sale } from "../types/saleTypes";
import type { Reseller } from "../../resellers/types";

export const useSaleForm = (onSubmit: (sale: Sale) => void, onOpenChange: (open: boolean) => void) => {
  const [saleType, setSaleType] = useState<"regular" | "reseller">("regular");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(120);
  const [loanGas, setLoanGas] = useState(false);
  const [cylinderMovement, setCylinderMovement] = useState<'none' | 'loan' | 'return'>('none');
  const [movementQuantity, setMovementQuantity] = useState(1);

  // Atualizar preço quando reseller ou produto mudam
  useEffect(() => {
    if (saleType === "reseller" && selectedReseller && product) {
      const prices: Record<string, number> = {
        p13: selectedReseller.priceP13,
        p20: selectedReseller.priceP20,
        p45: selectedReseller.priceP45,
        water: selectedReseller.priceWater,
      };
      
      setUnitPrice(prices[product] || 120);
    }
  }, [saleType, selectedReseller, product]);

  // Função para lidar com o envio do formulário
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const newSale: Sale = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      client: selectedClient ? selectedClient.name : "Venda Avulsa",
      product: product === 'p13' ? 'GLP P13' : 
               product === 'p20' ? 'GLP P20' :
               product === 'p45' ? 'GLP P45' : 'Água 20L',
      quantity,
      payment: paymentMethod === 'cash' ? 'Dinheiro' :
               paymentMethod === 'credit' ? 'Crédito' :
               paymentMethod === 'debit' ? 'Débito' :
               paymentMethod === 'pix' ? 'PIX' :
               paymentMethod === 'promissory' ? 'Promissória' :
               paymentMethod === 'gasVoucher' ? 'Vale Gás' : 'Convênio',
      amount: quantity * unitPrice
    };

    // Limpar o formulário
    setSelectedClient(null);
    setSelectedReseller(null);
    setSaleType("regular");
    setPaymentMethod("");
    setProduct("");
    setQuantity(1);
    setUnitPrice(120);
    setLoanGas(false);
    setCylinderMovement('none');
    setMovementQuantity(1);

    onSubmit(newSale);
    onOpenChange(false);
  }, [
    selectedClient,
    paymentMethod,
    product,
    quantity,
    unitPrice,
    onSubmit,
    onOpenChange
  ]);

  // Função para resetar o formulário
  const resetForm = useCallback(() => {
    setSelectedClient(null);
    setSelectedReseller(null);
    setSaleType("regular");
    setPaymentMethod("");
    setProduct("");
    setQuantity(1);
    setUnitPrice(120);
    setLoanGas(false);
    setCylinderMovement('none');
    setMovementQuantity(1);
  }, []);

  return {
    saleType,
    setSaleType,
    selectedClient,
    setSelectedClient,
    selectedReseller,
    setSelectedReseller,
    paymentMethod,
    setPaymentMethod,
    product,
    setProduct,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    loanGas,
    setLoanGas,
    cylinderMovement,
    setCylinderMovement,
    movementQuantity,
    setMovementQuantity,
    handleSubmit,
    resetForm
  };
};
