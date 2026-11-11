
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "lucide-react";
import { ClientSelection } from "./ClientSelection";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import { ProductSelection } from "./ProductSelection";
import { CylinderMovement } from "./CylinderMovement";
import { ResellerSelection } from "./ResellerSelection";
import { useResellers } from "../../../resellers/hooks/useResellers";
import { useSaleClients } from "../../hooks/useSaleClients";
import { useAuth } from "@/contexts/AuthContext";
import { useSaleForm } from "../../hooks/useSaleForm";
import type { Sale } from "../../types/saleTypes";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { CashierContext } from "@/contexts/CashierContext";


interface SaleFormContentProps {
  onSubmit: (sale: Sale) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function SaleFormContent({ onSubmit, onOpenChange }: SaleFormContentProps) {
  const { user } = useAuth();
  const { resellers } = useResellers();
  const { data: clients = [], isLoading: loadingClients } = useSaleClients();

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
    handleSubmit,
    enviando,
    erro
  } = useSaleForm(onSubmit, onOpenChange);
  const caixa = useContext(CashierContext);

  return (
    <form id="sale-form" onSubmit={handleSubmit} className="space-y-4" aria-busy={enviando}>
     <fieldset disabled={enviando} className="space-y-4 border-0 p-0 m-0 min-w-0">
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
          loading={loadingClients}

        />
      ) : (
        <ResellerSelection
          selectedReseller={selectedReseller}
          onSelectReseller={setSelectedReseller}
          resellers={resellers}
          showPrices={user?.role === 'admin' || user?.role === 'gerente'}
        />
      )}
      
      {saleType === "regular" ? (
        <>
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
            paymentMethod={paymentMethod}
          />
        </>
      ) : (
        <>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium">Venda a acertar (nota promissória)</p>
            <p className="text-muted-foreground">
              Não é preciso informar valor agora. Os botijões entram na conta do agregado e o preço
              é definido no recebimento, pelo menu Revendedores.
            </p>
          </div>

          <ProductSelection
            product={product}
            quantity={quantity}
            unitPrice={unitPrice}
            onProductChange={setProduct}
            onQuantityChange={setQuantity}
            onUnitPriceChange={setUnitPrice}
            hidePrice
            paymentMethod={paymentMethod}
          />
        </>
      )}

      
      <CylinderMovement
        loanGas={loanGas}
        cylinderMovement={cylinderMovement}
        movementQuantity={movementQuantity}
        onLoanGasChange={setLoanGas}
        onCylinderMovementChange={setCylinderMovement}
        onMovementQuantityChange={setMovementQuantity}
      />
     </fieldset>

      {enviando && (
        <p role="status" className="text-sm text-muted-foreground">Registrando a venda… aguarde a confirmação.</p>
      )}
      {erro && (
        <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <p className="font-medium text-destructive">Venda não registrada</p>
          <p>{erro}</p>
          <p className="text-muted-foreground">Os dados continuam preenchidos.</p>
          {caixa?.duvidaVenda && (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={caixa.descartarDuvidaVenda}>
              Descartar a tentativa anterior e registrar como nova venda
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
