
import { PaymentSummary } from "../../PaymentSummary";
import { InventoryTable } from "../../InventoryTable";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";
import { formatCurrency, formatQuantities } from "@/lib/formatUtils";
import { ValueConferenceSection } from "./ValueConferenceSection";
import { getTotalSalesFromPartials, getTotalQuantityFromPartials } from "../../../utils/cashierUtils";

interface SummarySectionProps {
  isPartialClosing: boolean;
  partialClosings: PartialClosing[];
  cashierData: CashierData;
  adaptedSalesData: CashierData;
  inventoryData: any;
  /** Data do fechamento (YYYY-MM-DD) */
  date: string;
}

export function SummarySection({
  isPartialClosing,
  partialClosings,
  cashierData,
  adaptedSalesData,
  inventoryData,
  date,
}: SummarySectionProps) {
  // Create default inventory data if none is provided
  const defaultInventoryData = [
    { product: 'P13', initial: 10, additions: 0, sales: isPartialClosing ? Math.floor(adaptedSalesData.quantities.cash.p13 + adaptedSalesData.quantities.credit.p13) : Math.floor(cashierData.quantities.cash.p13 + cashierData.quantities.credit.p13), final: 10 },
    { product: 'P20', initial: 5, additions: 0, sales: isPartialClosing ? Math.floor(adaptedSalesData.quantities.cash.p20 + adaptedSalesData.quantities.credit.p20) : Math.floor(cashierData.quantities.cash.p20 + cashierData.quantities.credit.p20), final: 5 },
    { product: 'P45', initial: 3, additions: 0, sales: isPartialClosing ? Math.floor(adaptedSalesData.quantities.cash.p45 + adaptedSalesData.quantities.credit.p45) : Math.floor(cashierData.quantities.cash.p45 + cashierData.quantities.credit.p45), final: 3 },
    { product: 'Água', initial: 20, additions: 0, sales: isPartialClosing ? Math.floor(adaptedSalesData.quantities.cash.water + adaptedSalesData.quantities.credit.water) : Math.floor(cashierData.quantities.cash.water + cashierData.quantities.credit.water), final: 20 },
  ];
  
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
        data={isPartialClosing ? adaptedSalesData : cashierData} 
        formatCurrency={formatCurrency}
        formatQuantities={formatQuantities}
      />
      
      <ValueConferenceSection date={date} />

      <InventoryTable 
        data={defaultInventoryData} 
        inventoryMovements={[]}
      />
    </div>
  );
}
