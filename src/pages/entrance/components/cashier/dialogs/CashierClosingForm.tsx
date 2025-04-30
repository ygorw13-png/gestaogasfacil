
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ObservationsSection } from "../../ObservationsSection";
import { useState } from "react";
import { CashierClosingSummary } from "./CashierClosingSummary";
import { ClosingTypeTabs } from "../ClosingTypeTabs";
import { inventoryClosing } from "../../../data/mockData";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";

interface CashierClosingFormProps {
  onSubmit: (type: "partial" | "total", observations?: string) => void;
  onCancel: () => void;
  cashierData: CashierData;
  partialClosings: PartialClosing[];
  totalSalesSinceLastPartial: {
    count: number;
    amount: number;
  };
}

export function CashierClosingForm({
  onSubmit,
  onCancel,
  cashierData,
  partialClosings,
  totalSalesSinceLastPartial
}: CashierClosingFormProps) {
  const [closingType, setClosingType] = useState<"partial" | "total">("partial");
  const [observations, setObservations] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(closingType, observations);
  };

  // Converter totalSalesSinceLastPartial para um formato compatível com CashierData
  // para passar para CashierClosingSummary
  const adaptedSalesData: CashierData = {
    cash: cashierData.cash / 2,
    credit: cashierData.credit / 2,
    debit: cashierData.debit / 2,
    pix: cashierData.pix / 2,
    promissory: cashierData.promissory / 2,
    gasVoucher: cashierData.gasVoucher / 2,
    totalSales: totalSalesSinceLastPartial.amount,
    quantities: {
      cash: { p13: 0, p20: 0, p45: 0, water: 0 },
      credit: { p13: 0, p20: 0, p45: 0, water: 0 },
      debit: { p13: 0, p20: 0, p45: 0, water: 0 },
      pix: { p13: 0, p20: 0, p45: 0, water: 0 },
      promissory: { p13: 0, p20: 0, p45: 0, water: 0 },
      gasVoucher: { p13: 0, p20: 0, p45: 0, water: 0 }
    },
    inventoryMovements: []
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ClosingTypeTabs 
        type={closingType} 
        setType={setClosingType} 
        partialCount={partialClosings.length}
      />
      
      <CashierClosingSummary
        cashierData={cashierData}
        inventoryData={inventoryClosing}
        isPartialClosing={closingType === "partial"}
        totalSalesSinceLastPartial={adaptedSalesData}
        partialClosings={partialClosings}
      />
      
      <ObservationsSection value={observations} onChange={setObservations} />
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {closingType === "partial" ? "Confirmar Fechamento Parcial" : "Confirmar Fechamento Total"}
        </Button>
      </DialogFooter>
    </form>
  );
}
