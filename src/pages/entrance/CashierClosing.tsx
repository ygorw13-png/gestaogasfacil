
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
  onSubmit, 
  cashierData 
}: CashierClosingProps) {
  const { toast } = useToast();
  const [partialClosings] = useState<PartialClosing[]>(mockPartialClosings);
  
  const handleSubmit = () => {
    // Em uma implementação real, você salvaria os dados do fechamento
    // e adicionaria à lista de fechamentos parciais se for o caso
    
    toast({
      title: "Fechamento realizado com sucesso",
      description: "Os dados foram salvos e o caixa foi atualizado."
    });
    
    onSubmit();
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
