import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ObservationsSection } from "../../ObservationsSection";
import { useState, useMemo } from "react";
import { FileText, CalendarIcon, AlertTriangle } from "lucide-react";
import { ClosingTypeTabs } from "../ClosingTypeTabs";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";
import { SummarySection } from "./SummarySection";
import { prepareAdaptedSalesData, buildCashierDataFromVendasPorData } from "../../../utils/closingCalculations";
import { gerarPdfFechamento } from "../../../utils/closingPdf";
import {
  RemainingStockSection,
  emptyRemainingStock,
  type RemainingStockMap,
} from "./RemainingStockSection";
import {
  useRegistrarMovimentacao,
  produtoLabel,
  type PortariaProduto,
} from "../../../hooks/usePortariaStock";
import { useVendasPorData } from "../../../hooks/useVendasPorData";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const todayStr = () => new Date().toISOString().slice(0, 10);
const isSameDayAsToday = (dateStr: string) => dateStr === todayStr();

export function CashierClosingForm({
  onSubmit,
  onCancel,
  cashierData,
  partialClosings,
  totalSalesSinceLastPartial,
}: CashierClosingFormProps) {
  const [closingType, setClosingType] = useState<"partial" | "total">("partial");
  const [observations, setObservations] = useState<string>("");
  const [remaining, setRemaining] = useState<RemainingStockMap>(emptyRemainingStock());
  const [closingDate, setClosingDate] = useState<string>(todayStr());
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>(new Date());

  const registrar = useRegistrarMovimentacao();
  const { data: vendasPorData } = useVendasPorData(closingDate);
  const { toast } = useToast();

  const isRetroactive = !isSameDayAsToday(closingDate);
  const selectedDateCashierData = useMemo(
    () => (isRetroactive ? buildCashierDataFromVendasPorData(vendasPorData) : cashierData),
    [isRetroactive, vendasPorData, cashierData]
  );

  const selectedDateSales = useMemo(() => {
    if (!isRetroactive) return null;
    return {
      p13: vendasPorData?.glpSales.p13 ?? 0,
      p20: vendasPorData?.glpSales.p20 ?? 0,
      p45: vendasPorData?.glpSales.p45 ?? 0,
      water: vendasPorData?.waterSales ?? 0,
    };
  }, [isRetroactive, vendasPorData]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDateObj(date);
    if (date) {
      setClosingDate(date.toISOString().slice(0, 10));
    }
  };

  const handleGerarPdf = () => {
    const baseData = isRetroactive ? selectedDateCashierData : cashierData;
    const salesForProduct = (p: PortariaProduto) => {
      if (!isRetroactive) return undefined;
      return p === "agua" ? selectedDateSales?.water : selectedDateSales?.[p.toLowerCase() as "p13" | "p20" | "p45"];
    };

    gerarPdfFechamento({
      tipo: closingType,
      cashierData: baseData,
      observacoes: observations,
      dataFechamento: closingDate,
      estoque: PRODUCTS.map((p) => ({
        produto: produtoLabel(p),
        vendas: salesForProduct(p) ?? baseData.totalSales,
        sistemaCheios: 0,
        contadoCheios: remaining[p].cheios,
        sistemaVazios: 0,
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
    if (closingType === "total") {
      try {
        for (const p of PRODUCTS) {
          const infCheios = remaining[p].cheios;
          const infVazios = remaining[p].vazios;
          const observacaoBase = isRetroactive
            ? `Fechamento retroativo de ${format(new Date(closingDate + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}`
            : "Fechamento de caixa";

          // Para fechamento retroativo, ajuste baseado na contagem informada (sem saldo atual do sistema)
          if (isRetroactive) {
            await registrar.mutateAsync({
              tipo: "fechamento",
              produto: p,
              delta_cheios: 0,
              delta_vazios: 0,
              observacoes: `${observacaoBase} — contagem final: ${infCheios} cheios / ${infVazios} vazios`,
              data_operacao: closingDate,
            });
          } else {
            // Fechamento normal do dia atual
            await registrar.mutateAsync({
              tipo: "fechamento",
              produto: p,
              delta_cheios: 0,
              delta_vazios: 0,
              observacoes: `Fechamento: ${infCheios} cheios / ${infVazios} vazios`,
            });
          }
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

    // Gera automaticamente o PDF para imprimir e anexar ao envelope
    handleGerarPdf();

    onSubmit(closingType, observations);
  };

  // Converter totalSalesSinceLastPartial para um formato compatível com CashierData
  const adaptedSalesData = prepareAdaptedSalesData(selectedDateCashierData, totalSalesSinceLastPartial.amount);

  const inventoryData = PRODUCTS.map((p) => ({
    product: p === "agua" ? "Água" : p,
    initial: 0,
    additions: 0,
    sales:
      isRetroactive && selectedDateSales
        ? p === "agua"
          ? selectedDateSales.water
          : selectedDateSales[p.toLowerCase() as "p13" | "p20" | "p45"]
        : selectedDateCashierData.totalSales,
    final: remaining[p].cheios,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <ClosingTypeTabs
          type={closingType}
          setType={setClosingType}
          partialCount={partialClosings.length}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted- whitespace-nowrap">Data do fechamento:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[180px] justify-start text-left font-normal",
                  !selectedDateObj && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDateObj ? (
                  format(selectedDateObj, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isRetroactive && (
        <Alert variant="warning" className="border-amber-500 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você está fechando o caixa de um dia anterior. Os valores exibidos são as vendas registradas
            naquela data. A contagem de estoque deve ser a que restou no final daquele dia.
          </AlertDescription>
        </Alert>
      )}

      <SummarySection
        isPartialClosing={closingType === "partial"}
        partialClosings={partialClosings}
        cashierData={selectedDateCashierData}
        adaptedSalesData={adaptedSalesData}
        inventoryData={inventoryData}
      />

      {closingType === "total" && (
        <RemainingStockSection value={remaining} onChange={setRemaining} />
      )}

      <ObservationsSection value={observations} onChange={setObservations} />

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="secondary" onClick={handleGerarPdf} className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar PDF
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
