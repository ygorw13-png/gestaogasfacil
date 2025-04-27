
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SaleFormContent } from "./SaleFormContent";
import type { NewSaleFormProps } from "../../types/saleTypes";

export function MobileSaleForm({ isOpen, onOpenChange, onSubmit }: NewSaleFormProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          <span>Nova Venda</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Registrar Nova Venda</SheetTitle>
          <SheetDescription>
            Preencha os campos abaixo para registrar uma nova venda na portaria.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 flex-1 h-[calc(90vh-180px)]">
          <ScrollArea className="h-full">
            <div className="pr-4">
              <SaleFormContent onSubmit={onSubmit} onOpenChange={onOpenChange} />
            </div>
          </ScrollArea>
        </div>
        
        <SheetFooter className="border-t pt-4">
          <div className="flex w-full gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button form="sale-form" type="submit">
              Registrar Venda
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
