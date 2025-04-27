
import { PaymentSummary } from "../../PaymentSummary";
import { InventoryTable } from "../../InventoryTable";
import { CashierData } from "../../../types/cashierTypes";
import { formatCurrency, formatQuantities } from "@/lib/formatUtils";

interface CashierClosingSummaryProps {
  cashierData: CashierData;
  inventoryData: any;
  isPartialClosing: boolean;
  totalSalesSinceLastPartial: CashierData;
  partialClosings: any[];
}

export function CashierClosingSummary({
  cashierData,
  inventoryData,
  isPartialClosing,
  totalSalesSinceLastPartial,
  partialClosings
}: CashierClosingSummaryProps) {
  return (
    <div className="space-y-6">
      {!isPartialClosing && partialClosings.length > 0 && (
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
        data={isPartialClosing ? totalSalesSinceLastPartial : cashierData} 
        formatCurrency={formatCurrency}
        formatQuantities={formatQuantities}
      />
      
      <InventoryTable 
        data={isPartialClosing 
          ? getInventoryForPartialClosing(inventoryData, partialClosings)
          : inventoryData
        } 
      />
    </div>
  );
}

// Funções auxiliares movidas do arquivo original
const getTotalSalesFromPartials = (partialClosings: any[]): number => {
  return partialClosings.reduce((total, closing) => total + closing.totalSales, 0);
};

const getTotalQuantityFromPartials = (
  partialClosings: any[], 
  productType: 'p13' | 'p20' | 'p45' | 'water'
): number => {
  return partialClosings.reduce((total, closing) => total + closing.quantities[productType], 0);
};

const getInventoryForPartialClosing = (inventory: any, partialClosings: any[]) => {
  return inventory;
};
