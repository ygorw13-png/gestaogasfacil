
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, History } from "lucide-react";
import { useState } from "react";
import { PaymentSummary } from "../PaymentSummary";
import { InventoryTable } from "../InventoryTable";
import { ObservationsSection } from "../ObservationsSection";
import { CashierData } from "../../types/cashierTypes";
import { inventoryClosing } from "../../data/mockData";
import { formatCurrency, formatQuantities } from "@/lib/formatUtils";
import { ClosingHistoryTable } from "./ClosingHistoryTable";
import { ClosingTypeTabs } from "./ClosingTypeTabs";
import { useToast } from "@/hooks/use-toast";

interface CashierClosingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
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
  const [closingType, setClosingType] = useState<"partial" | "total">("partial");
  const [observations, setObservations] = useState("");
  const { toast } = useToast();

  const totalSalesSinceLastPartial = calculateSalesSinceLastPartial(cashierData, partialClosings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (closingType === "partial") {
      toast({
        title: "Fechamento parcial realizado",
        description: `Fechamento parcial de caixa realizado com sucesso às ${new Date().toLocaleTimeString()}.`,
      });
    } else {
      toast({
        title: "Fechamento total realizado",
        description: "O caixa foi fechado para o dia e os valores foram transferidos para o próximo dia.",
      });
    }
    
    onSubmit();
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
          
          <TabsContent value="form" className="space-y-6">
            <ClosingTypeTabs 
              type={closingType} 
              setType={setClosingType} 
              partialCount={partialClosings.length}
            />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {closingType === "total" && partialClosings.length > 0 && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-md font-medium mb-2">Resumo de Fechamentos Parciais</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Foram realizados <span className="font-bold">{partialClosings.length}</span> fechamentos parciais hoje.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total de P13 nos fechamentos parciais:</span>
                      <span className="font-medium">{getTotalQuantityFromPartials(partialClosings, 'p13')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de P20 nos fechamentos parciais:</span>
                      <span className="font-medium">{getTotalQuantityFromPartials(partialClosings, 'p20')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de P45 nos fechamentos parciais:</span>
                      <span className="font-medium">{getTotalQuantityFromPartials(partialClosings, 'p45')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Água nos fechamentos parciais:</span>
                      <span className="font-medium">{getTotalQuantityFromPartials(partialClosings, 'water')}</span>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t">
                      <span>Valor total fechado parcialmente:</span>
                      <span className="font-medium">R$ {formatCurrency(getTotalSalesFromPartials(partialClosings))}</span>
                    </div>
                  </div>
                </div>
              )}
            
              <PaymentSummary 
                data={closingType === "total" ? cashierData : totalSalesSinceLastPartial} 
                formatCurrency={formatCurrency}
                formatQuantities={formatQuantities}
              />
              
              <InventoryTable 
                data={closingType === "total" 
                  ? inventoryClosing 
                  : getInventoryForPartialClosing(inventoryClosing, partialClosings)} 
              />
              
              <ObservationsSection value={observations} onChange={setObservations} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {closingType === "partial" ? "Confirmar Fechamento Parcial" : "Confirmar Fechamento Total"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="history">
            <ClosingHistoryTable partialClosings={partialClosings} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Funções auxiliares para calcular dados dos fechamentos
const calculateSalesSinceLastPartial = (cashierData: CashierData, partialClosings: PartialClosing[]): CashierData => {
  // Se não houver fechamentos parciais, retorna os dados completos
  if (partialClosings.length === 0) return cashierData;
  
  // Cálculo simplificado para demonstração
  // Em um cenário real, você precisaria rastrear vendas por hora
  const totalPartialSales = getTotalSalesFromPartials(partialClosings);
  
  return {
    ...cashierData,
    totalSales: cashierData.totalSales - totalPartialSales,
    // Outros campos seriam ajustados para refletir apenas vendas desde o último fechamento parcial
    cash: cashierData.cash / 2, // Exemplo simplificado
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

const getInventoryForPartialClosing = (
  inventory: any,
  partialClosings: PartialClosing[]
) => {
  // Simplificado para demonstração
  // Em um cenário real, você calcularia o estoque baseado no último fechamento parcial
  return inventory;
};

const getTotalSalesFromPartials = (partialClosings: PartialClosing[]): number => {
  return partialClosings.reduce((total, closing) => total + closing.totalSales, 0);
};

const getTotalQuantityFromPartials = (
  partialClosings: PartialClosing[], 
  productType: 'p13' | 'p20' | 'p45' | 'water'
): number => {
  return partialClosings.reduce((total, closing) => total + closing.quantities[productType], 0);
};

const getTotalQuantityTypeFromPartials = (
  partialClosings: PartialClosing[],
  productType: 'p13' | 'p20' | 'p45' | 'water',
  paymentType: string
): number => {
  // Neste caso fictício, apenas retornamos uma estimativa baseada no total
  // Em um caso real, você teria o detalhamento por tipo de pagamento
  return Math.floor(getTotalQuantityFromPartials(partialClosings, productType) / 3);
};
