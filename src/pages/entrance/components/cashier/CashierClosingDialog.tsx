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
import { CashierData } from "../../types/cashierTypes";
import { Button } from "@/components/ui/button";
import { ClosingHistoryTable } from "./ClosingHistoryTable";
import { CashierClosingForm } from "./dialogs/CashierClosingForm";

interface CashierClosingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (type: "partial" | "total", observations?: string) => void;
  cashierData: CashierData;
  partialClosings?: PartialClosing[];
}

export interface PartialClosing {
  id: string;
  timestamp: string;
  totalSales: number;
  quantities: {
    p13: number;
    p20: number;
    p45: number;
    water: number;
  };
  observations?: string;
}

export function CashierClosingDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  cashierData,
  partialClosings = [] 
}: CashierClosingDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("form");
  const totalSalesSinceLastPartial = calculateSalesSinceLastPartial(cashierData, partialClosings);

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

const calculateSalesSinceLastPartial = (cashierData: CashierData, partialClosings: PartialClosing[]): CashierData => {
  if (partialClosings.length === 0) return cashierData;
  
  const totalPartialSales = getTotalSalesFromPartials(partialClosings);
  
  return {
    ...cashierData,
    totalSales: cashierData.totalSales - totalPartialSales,
    cash: cashierData.cash / 2,
    credit: cashierData.credit / 2,
    debit: cashierData.debit / 2,
    pix: cashierData.pix / 2,
    promissory: cashierData.promissory / 2,
    gasVoucher: cashierData.gasVoucher / 2,
    quantities: {
      cash: {
        p13: cashierData.quantities.cash.p13 - getTotalQuantityTypeFromPartials(partialClosings, 'p13', 'cash'),
        p20: cashierData.quantities.cash.p20 - getTotalQuantityTypeFromPartials(partialClosings, 'p20', 'cash'),
        p45: cashierData.quantities.cash.p45 - getTotalQuantityTypeFromPartials(partialClosings, 'p45', 'cash'),
        water: cashierData.quantities.cash.water - getTotalQuantityTypeFromPartials(partialClosings, 'water', 'cash')
      },
      credit: {
        p13: cashierData.quantities.credit.p13 / 2,
        p20: cashierData.quantities.credit.p20 / 2,
        p45: cashierData.quantities.credit.p45 / 2,
        water: cashierData.quantities.credit.water / 2
      },
      debit: {
        p13: cashierData.quantities.debit.p13 / 2,
        p20: cashierData.quantities.debit.p20 / 2,
        p45: cashierData.quantities.debit.p45 / 2,
        water: cashierData.quantities.debit.water / 2
      },
      pix: {
        p13: cashierData.quantities.pix.p13 / 2,
        p20: cashierData.quantities.pix.p20 / 2,
        p45: cashierData.quantities.pix.p45 / 2,
        water: cashierData.quantities.pix.water / 2
      },
      promissory: {
        p13: cashierData.quantities.promissory.p13 / 2,
        p20: cashierData.quantities.promissory.p20 / 2,
        p45: cashierData.quantities.promissory.p45 / 2,
        water: cashierData.quantities.promissory.water / 2
      },
      gasVoucher: {
        p13: cashierData.quantities.gasVoucher.p13 / 2,
        p20: cashierData.quantities.gasVoucher.p20 / 2,
        p45: cashierData.quantities.gasVoucher.p45 / 2,
        water: cashierData.quantities.gasVoucher.water / 2
      }
    },
    inventoryMovements: cashierData.inventoryMovements.filter(
      mov => new Date(mov.timestamp).getTime() > 
             new Date(partialClosings[partialClosings.length - 1].timestamp).getTime()
    )
  };
};
