
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ObservationsSection } from "../../ObservationsSection";
import { useState } from "react";
import { FileText } from "lucide-react";
import { ClosingTypeTabs } from "../ClosingTypeTabs";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";
import { SummarySection } from "./SummarySection";
import { prepareAdaptedSalesData } from "../../../utils/closingCalculations";
import { gerarPdfFechamento } from "../../../utils/closingPdf";
import {
  RemainingStockSection,
  emptyRemainingStock,
  type RemainingStockMap,
} from "./RemainingStockSection";
import {
  useRegistrarMovimentacao,
  useSaldoPortaria,
  produtoLabel,
  type PortariaProduto,
} from "../../../hooks/usePortariaStock";
import { useToast } from "@/hooks/use-toast";

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

const PRODUCTS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

export function CashierClosingForm({
  onSubmit,
  onCancel,
  cashierData,
  partialClosings,
  totalSalesSinceLastPartial
}: CashierClosingFormProps) {
  const [closingType, setClosingType] = useState<"partial" | "total">("partial");
  const [observations, setObservations] = useState<string>("");
  const [remaining, setRemaining] = useState<RemainingStockMap>(emptyRemainingStock());
  const { data: saldo } = useSaldoPortaria();
  const registrar = useRegistrarMovimentacao();
  const { toast } = useToast();

  const handleGerarPdf = () => {
    gerarPdfFechamento({
      tipo: closingType,
      cashierData,
      observacoes: observations,
      estoque: PRODUCTS.map((p) => ({
        produto: produtoLabel(p),
        vendas: saldo?.[p].vendas_dia ?? 0,
        sistemaCheios: saldo?.[p].cheios ?? 0,
        contadoCheios: remaining[p].cheios,
        sistemaVazios: saldo?.[p].vazios ?? 0,
        contadoVazios: remaining[p].vazios,
      })),
    });
    toast({
      title: "PDF gerado",
      description: "O relatório foi baixado. Imprima e coloque junto ao envelope.",
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Para fechamento total, registrar snapshot por produto (com ajuste se houver divergência)
    if (closingType === "total" && saldo) {
      try {
        for (const p of PRODUCTS) {
          const sysCheios = saldo[p].cheios;
          const sysVazios = saldo[p].vazios;
          const infCheios = remaining[p].cheios;
          const infVazios = remaining[p].vazios;
          const diffCheios = infCheios - sysCheios;
          const diffVazios = infVazios - sysVazios;

          if (diffCheios !== 0 || diffVazios !== 0) {
            await registrar.mutateAsync({
              tipo: "ajuste",
              produto: p,
              delta_cheios: diffCheios,
              delta_vazios: diffVazios,
              observacoes: `Ajuste no fechamento — divergência de contagem`,
            });
          }

          await registrar.mutateAsync({
            tipo: "fechamento",
            produto: p,
            delta_cheios: 0,
            delta_vazios: 0,
            observacoes: `Fechamento: ${infCheios} cheios / ${infVazios} vazios`,
          });
        }
      } catch (err: any) {
        toast({
          title: "Erro ao registrar fechamento",
          description: err?.message || "Tente novamente",
          variant: "destructive",
        });
        return;
      }
    }

    onSubmit(closingType, observations);
  };

  // Converter totalSalesSinceLastPartial para um formato compatível com CashierData
  const adaptedSalesData = prepareAdaptedSalesData(cashierData, totalSalesSinceLastPartial.amount);

  const inventoryData = PRODUCTS.map((p) => ({
    product: p === "agua" ? "Água" : p,
    initial: 0,
    additions: 0,
    sales: saldo?.[p].vendas_dia ?? 0,
    final: remaining[p].cheios,
  }));

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

      {closingType === "total" && (
        <RemainingStockSection value={remaining} onChange={setRemaining} />
      )}
      
      <ObservationsSection value={observations} onChange={setObservations} />
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={registrar.isPending}>
          {registrar.isPending
            ? "Registrando..."
            : closingType === "partial"
              ? "Confirmar Fechamento Parcial"
              : "Confirmar Fechamento Total"}
        </Button>
      </DialogFooter>
    </form>
  );
}
