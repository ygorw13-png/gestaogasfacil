
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (saleType === "reseller" && selectedReseller && product) {
      switch (product) {
        case "p13":
          setUnitPrice(selectedReseller.priceP13);
          break;
        case "p20":
          setUnitPrice(selectedReseller.priceP20);
          break;
        case "p45":
          setUnitPrice(selectedReseller.priceP45);
          break;
        case "water":
          setUnitPrice(selectedReseller.priceWater);
          break;
      }
    }
  }, [saleType, selectedReseller, product]);

  const handleSubmit = (e: React.FormEvent) => {
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

    // Clear the form
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
  };

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
    handleSubmit
  };
};
