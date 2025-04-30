
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
        totalSalesSinceLastPartial={totalSalesSinceLastPartial}
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
