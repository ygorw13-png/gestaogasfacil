
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ClientSelection } from "./components/sale-form/ClientSelection";
import { PaymentMethodSelect } from "./components/sale-form/PaymentMethodSelect";
import { ProductSelection } from "./components/sale-form/ProductSelection";
import { CylinderMovement } from "./components/sale-form/CylinderMovement";
import { 
  Sheet, 
  SheetContent,
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

const clients = [
  { id: 1, name: "Maria Silva", phone: "(11) 98765-4321", type: "Regular" },
  { id: 2, name: "João Oliveira", phone: "(11) 91234-5678", type: "Regular" },
  { id: 3, name: "Supermercado ABC", phone: "(11) 3333-4444", type: "Convênio" },
  { id: 4, name: "José Distribuidora", phone: "(11) 97777-8888", type: "Agregado" },
  { id: 5, name: "Restaurante Sabor", phone: "(11) 95555-6666", type: "Convênio" },
];

interface NewSaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export default function NewSaleForm({ isOpen, onOpenChange, onSubmit }: NewSaleFormProps) {
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(120);
  const [loanGas, setLoanGas] = useState(false);
  const [cylinderMovement, setCylinderMovement] = useState<'none' | 'loan' | 'return'>('none');
  const [movementQuantity, setMovementQuantity] = useState(1);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ClientSelection
        selectedClient={selectedClient}
        onSelectClient={setSelectedClient}
        clients={clients}
      />
      
      <PaymentMethodSelect
        value={paymentMethod}
        onChange={setPaymentMethod}
      />
      
      <ProductSelection
        product={product}
        quantity={quantity}
        unitPrice={unitPrice}
        onProductChange={setProduct}
        onQuantityChange={setQuantity}
        onUnitPriceChange={setUnitPrice}
      />
      
      <CylinderMovement
        loanGas={loanGas}
        cylinderMovement={cylinderMovement}
        movementQuantity={movementQuantity}
        onLoanGasChange={setLoanGas}
        onCylinderMovementChange={setCylinderMovement}
        onMovementQuantityChange={setMovementQuantity}
      />
    </form>
  );

  if (isMobile) {
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
                <FormContent />
              </div>
            </ScrollArea>
          </div>
          
          <SheetFooter className="border-t pt-4">
            <div className="flex w-full gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" onClick={(e) => {e.preventDefault(); onSubmit();}}>
                Registrar Venda
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

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
              <FormContent />
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
          <Button type="submit" onClick={(e) => {e.preventDefault(); onSubmit();}}>
            Registrar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
