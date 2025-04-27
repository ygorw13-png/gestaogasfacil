
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SaleFormContent } from "./SaleFormContent";
import type { NewSaleFormProps } from "../../types/saleTypes";

export function DesktopSaleForm({ isOpen, onOpenChange, onSubmit }: NewSaleFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          <span>Nova Venda</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Nova Venda</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para registrar uma nova venda na portaria.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ScrollArea className="h-[60vh]">
            <div className="pr-4">
              <SaleFormContent onSubmit={onSubmit} onOpenChange={onOpenChange} />
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button form="sale-form" type="submit">
            Registrar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
