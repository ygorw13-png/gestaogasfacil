
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, History } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClosingHistoryTable } from "./ClosingHistoryTable";
import { CashierClosingForm } from "./dialogs/CashierClosingForm";
import { calculateSalesAmountSinceLastPartial } from "../../utils/closingCalculations";
import { useCashier } from "@/contexts/CashierContext";

interface CashierClosingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (type: "partial" | "total", observations?: string) => void;
}

export function CashierClosingDialog({ 
  isOpen, 
  onOpenChange,
  onSubmit
}: CashierClosingDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("form");
  const { cashierData, partialClosings, handleCashierClosingSubmit } = useCashier();
  
  const totalSalesSinceLastPartial = {
    count: partialClosings.length > 0 ? partialClosings.length : 0,
    amount: calculateSalesAmountSinceLastPartial(cashierData, partialClosings)
  };

  // Função que lida com o submit, usando o onSubmit da prop ou o handleCashierClosingSubmit do contexto
  const handleSubmit = (type: "partial" | "total", observations?: string) => {
    if (onSubmit) {
      onSubmit(type, observations);
    } else {
      handleCashierClosingSubmit(type, observations);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento de Caixa da Portaria</DialogTitle>
          <DialogDescription>
            Confira os valores recebidos e o estoque final antes de fechar o caixa.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Fechamento</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History size={16} />
              <span>Histórico</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="form">
            <CashierClosingForm
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              cashierData={cashierData}
              partialClosings={partialClosings}
              totalSalesSinceLastPartial={totalSalesSinceLastPartial}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <ClosingHistoryTable partialClosings={partialClosings} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
