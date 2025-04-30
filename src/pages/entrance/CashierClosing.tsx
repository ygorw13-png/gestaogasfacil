
import { useState } from "react";
import { CashierClosingDialog } from "./components/cashier/CashierClosingDialog";
import { CashierData, PartialClosing } from "./types/cashierTypes";
import { useToast } from "@/hooks/use-toast";
import { resetInventory } from "./data/mockData";

interface CashierClosingProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void; // This expects a function with no parameters
  cashierData: CashierData;
}

// Dados de exemplo para fechamentos parciais - inicializado vazio para um sistema limpo
const mockPartialClosings: PartialClosing[] = [];

export default function CashierClosing({ 
  isOpen, 
  onOpenChange, 
  onSubmit: parentOnSubmit, 
  cashierData 
}: CashierClosingProps) {
  const { toast } = useToast();
  const [partialClosings, setPartialClosings] = useState<PartialClosing[]>(mockPartialClosings);
  
  const handleSubmit = (type: "partial" | "total", observations?: string) => {
    // Em uma implementação real, você salvaria os dados do fechamento
    // e adicionaria à lista de fechamentos parciais se for o caso
    
    const message = type === "partial" 
      ? "Fechamento parcial realizado com sucesso. Os dados foram salvos e o caixa continua aberto para novas vendas."
      : "Fechamento total do dia realizado com sucesso. O caixa foi zerado e os valores transferidos para o próximo dia.";
    
    toast({
      title: type === "partial" ? "Fechamento parcial realizado" : "Fechamento total realizado",
      description: message
    });
    
    // Se for fechamento total, limpa os dados dos fechamentos parciais
    if (type === "total") {
      setPartialClosings([]);
      resetInventory();
    }
    
    // Call the parent onSubmit without passing parameters
    parentOnSubmit();
  };
  
  return (
    <CashierClosingDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      cashierData={cashierData}
      partialClosings={partialClosings}
    />
  );
}
