
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle } from "lucide-react";
import { CashierData } from "../../types/cashierTypes";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sale } from "../../types/entranceTypes";
import { SaleFormContent } from "../sale-form/SaleFormContent";
import { CashierClosingDialog } from "../cashier/CashierClosingDialog";
import { RegisterSaleButton } from "../sale-form/RegisterSaleButton";

interface EntranceHeaderProps {
  newSaleOpen: boolean;
  cashierClosingOpen: boolean;
  setNewSaleOpen: (open: boolean) => void;
  setCashierClosingOpen: (open: boolean) => void;
  onNewSaleSubmit: (sale: Sale) => void | Promise<void>;
  onCashierClosingSubmit: (type: "partial" | "total", observations?: string, isRetroactive?: boolean) => void;

  cashierData: CashierData;
}

export function EntranceHeader({
  newSaleOpen,
  cashierClosingOpen,
  setNewSaleOpen,
  setCashierClosingOpen,
  onNewSaleSubmit,
  onCashierClosingSubmit,
  cashierData
}: EntranceHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendas da Portaria</h1>
        <p className="text-muted-foreground">
          Registre vendas, controle o caixa e gerencia o estoque da portaria.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setNewSaleOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setCashierClosingOpen(true)}
        >
          <CheckCircle size={16} />
          <span>Fechar Caixa</span>
        </Button>
      </div>
      
      {/* Dialog para Nova Venda */}
      <Dialog open={newSaleOpen} onOpenChange={setNewSaleOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Nova Venda da Portaria</DialogTitle>
          </DialogHeader>
          <SaleFormContent 
            onSubmit={onNewSaleSubmit} 
            onOpenChange={setNewSaleOpen}
          />
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setNewSaleOpen(false)}>
              Cancelar
            </Button>
            <RegisterSaleButton />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Fechamento de Caixa */}
      <CashierClosingDialog 
        isOpen={cashierClosingOpen} 
        onOpenChange={setCashierClosingOpen}
        onSubmit={onCashierClosingSubmit}
      />
    </div>
  );
}
