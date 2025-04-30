
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, History } from "lucide-react";
import { useState } from "react";
import { CashierData, PartialClosing } from "../../types/cashierTypes";
import { Button } from "@/components/ui/button";
import { ClosingHistoryTable } from "./ClosingHistoryTable";
import { CashierClosingForm } from "./dialogs/CashierClosingForm";
import { getTotalSalesFromPartials, getTotalQuantityTypeFromPartials, getTotalQuantityFromPartials } from "../../utils/cashierUtils";

interface CashierClosingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (type: "partial" | "total", observations?: string) => void;
  cashierData: CashierData;
  partialClosings?: PartialClosing[];
}

export function CashierClosingDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  cashierData,
  partialClosings = [] 
}: CashierClosingDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("form");
  const totalSalesSinceLastPartial = {
    count: partialClosings.length > 0 ? partialClosings.length : 0,
    amount: calculateSalesAmountSinceLastPartial(cashierData, partialClosings)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Fechar Caixa</span>
        </Button>
      </DialogTrigger>
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
              onSubmit={onSubmit}
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

const calculateSalesAmountSinceLastPartial = (cashierData: CashierData, partialClosings: PartialClosing[]): number => {
  if (partialClosings.length === 0) return cashierData.totalSales;
  
  const totalPartialSales = getTotalSalesFromPartials(partialClosings);
  
  return cashierData.totalSales - totalPartialSales;
};

