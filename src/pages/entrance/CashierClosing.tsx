import { useState } from "react";
import { CashierClosingDialog, PartialClosing } from "./components/cashier/CashierClosingDialog";
import { CashierData } from "./types/cashierTypes";
import { useToast } from "@/hooks/use-toast";

interface CashierClosingProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  cashierData: CashierData;
}

// Dados de exemplo para fechamentos parciais
const mockPartialClosings: PartialClosing[] = [
  {
    id: "pc1",
    timestamp: "2025-04-27T10:30:00",
    totalSales: 1240.00,
    quantities: {
      p13: 10,
      p20: 0,
      p45: 0,
      water: 2
    },
    observations: "Fechamento parcial da manhã"
  },
  {
    id: "pc2",
    timestamp: "2025-04-27T14:15:00",
    totalSales: 1850.50,
    quantities: {
      p13: 15,
      p20: 0,
      p45: 0,
      water: 5
    },
    observations: "Fechamento parcial da tarde"
  }
];

export default function CashierClosing({ 
  isOpen, 
  onOpenChange, 
  onSubmit: parentOnSubmit, 
  cashierData 
}: CashierClosingProps) {
  const { toast } = useToast();
  const [partialClosings] = useState<PartialClosing[]>(mockPartialClosings);
  
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
