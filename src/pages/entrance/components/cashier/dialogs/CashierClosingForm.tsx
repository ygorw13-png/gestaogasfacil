
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ObservationsSection } from "../../ObservationsSection";
import { useState } from "react";
import { ClosingTypeTabs } from "../ClosingTypeTabs";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";
import { SummarySection } from "./SummarySection";
import { prepareAdaptedSalesData } from "../../../utils/closingCalculations";

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
  const adaptedSalesData = prepareAdaptedSalesData(cashierData, totalSalesSinceLastPartial.amount);

  // Create inventory data for the current closing
  const inventoryData = [
    { product: 'P13', initial: 10, additions: 0, sales: 2, final: 8 },
    { product: 'P20', initial: 5, additions: 0, sales: 1, final: 4 },
    { product: 'P45', initial: 3, additions: 0, sales: 0, final: 3 },
    { product: 'Água', initial: 20, additions: 0, sales: 5, final: 15 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ClosingTypeTabs 
        type={closingType} 
        setType={setClosingType} 
        partialCount={partialClosings.length}
      />
      
      <SummarySection
        isPartialClosing={closingType === "partial"}
        partialClosings={partialClosings}
        cashierData={cashierData}
        adaptedSalesData={adaptedSalesData}
        inventoryData={inventoryData}
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
