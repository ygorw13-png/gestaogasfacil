
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "lucide-react";
import { ClientSelection } from "./ClientSelection";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import { ProductSelection } from "./ProductSelection";
import { CylinderMovement } from "./CylinderMovement";
import { ResellerSelection } from "./ResellerSelection";
import { mockResellers } from "../../../resellers/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useSaleForm } from "../../hooks/useSaleForm";
import type { Sale } from "../../types/saleTypes";

const clients = [
  { id: 1, name: "Maria Silva", phone: "(11) 98765-4321", type: "Regular" },
  { id: 2, name: "João Oliveira", phone: "(11) 91234-5678", type: "Regular" },
  { id: 3, name: "Supermercado ABC", phone: "(11) 3333-4444", type: "Convênio" },
  { id: 4, name: "José Distribuidora", phone: "(11) 97777-8888", type: "Agregado" },
  { id: 5, name: "Restaurante Sabor", phone: "(11) 95555-6666", type: "Convênio" },
];

interface SaleFormContentProps {
  onSubmit: (sale: Sale) => void;
  onOpenChange: (open: boolean) => void;
}

export function SaleFormContent({ onSubmit, onOpenChange }: SaleFormContentProps) {
  const { user } = useAuth();
  const {
    saleType,
    setSaleType,
    selectedClient,
    setSelectedClient,
    selectedReseller,
    setSelectedReseller,
    paymentMethod,
    setPaymentMethod,
    product,
    setProduct,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    loanGas,
    setLoanGas,
    cylinderMovement,
    setCylinderMovement,
    movementQuantity,
    setMovementQuantity,
    handleSubmit
  } = useSaleForm(onSubmit, onOpenChange);

  return (
    <form id="sale-form" onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={saleType} onValueChange={(val: string) => setSaleType(val as "regular" | "reseller")} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="regular" className="flex-1">
            Venda Regular
          </TabsTrigger>
          <TabsTrigger value="reseller" className="flex-1 flex items-center gap-1">
            <Tag size={14} />
            <span>Venda para Agregado</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {saleType === "regular" ? (
        <ClientSelection
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          clients={clients}
        />
      ) : (
        <ResellerSelection
          selectedReseller={selectedReseller}
          onSelectReseller={setSelectedReseller}
          resellers={mockResellers}
          showPrices={user?.role === 'admin' || user?.role === 'manager'}
        />
      )}
      
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
        readOnlyPrice={saleType === "reseller"}
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
}
