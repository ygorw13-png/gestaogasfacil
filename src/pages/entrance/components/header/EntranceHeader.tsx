
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import NewSaleForm from "../../NewSaleForm";
import CashierClosing from "../../CashierClosing";
import type { Sale } from "../../types/entranceTypes";

interface EntranceHeaderProps {
  newSaleOpen: boolean;
  cashierClosingOpen: boolean;
  setNewSaleOpen: (open: boolean) => void;
  setCashierClosingOpen: (open: boolean) => void;
  onNewSaleSubmit: (sale: Sale) => void;
  onCashierClosingSubmit: () => void;
  cashierData: any;
}

export function EntranceHeader({
  newSaleOpen,
  cashierClosingOpen,
  setNewSaleOpen,
  setCashierClosingOpen,
  onNewSaleSubmit,
  onCashierClosingSubmit,
  cashierData,
}: EntranceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Portaria</h1>
      <div className="flex flex-wrap gap-2">
        <NewSaleForm 
          isOpen={newSaleOpen} 
          onOpenChange={setNewSaleOpen} 
          onSubmit={onNewSaleSubmit} 
        />
        
        <CashierClosing
          isOpen={cashierClosingOpen}
          onOpenChange={setCashierClosingOpen}
          onSubmit={onCashierClosingSubmit}
          cashierData={cashierData}
        />

        <Button variant="outline" asChild>
          <Link to="/orders" className="flex items-center gap-2">
            <Truck size={16} />
            <span>Ver Pedidos</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
