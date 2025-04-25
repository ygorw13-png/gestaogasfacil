
import { CashierClosingDialog } from "./components/cashier/CashierClosingDialog";
import { CashierData } from "./types/cashierTypes";

interface CashierClosingProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  cashierData: CashierData;
}

export default function CashierClosing({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  cashierData 
}: CashierClosingProps) {
  return (
    <CashierClosingDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      cashierData={cashierData}
    />
  );
}
