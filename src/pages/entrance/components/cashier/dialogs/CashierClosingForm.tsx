import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ObservationsSection } from "../../ObservationsSection";
import { useEffect, useMemo, useState } from "react";
import { FileText, CalendarIcon, AlertTriangle, Save } from "lucide-react";
import { ClosingTypeTabs } from "../ClosingTypeTabs";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";
import { SummarySection } from "./SummarySection";
import { ClosingSalesEditor } from "./ClosingSalesEditor";
import { prepareAdaptedSalesData, buildCashierDataFromVendasPorData } from "../../../utils/closingCalculations";
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
import { useVendasPorData } from "../../../hooks/useVendasPorData";
import { useSalvarFechamento } from "../../../hooks/useFechamentosCaixa";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CashierClosingFormProps {
  onSubmit: (type: "partial" | "total", observations?: string, isRetroactive?: boolean) => void;
  onCancel: () => void;
  cashierData: CashierData;
  partialClosings: PartialClosing[];
  totalSalesSinceLastPartial: {
    count: number;
    amount: number;
  };
}


const PRODUCTS: PortariaProduto[] = ["P13", "P20", "P45", "agua"];

const DRAFT_KEY = "portaria:fechamento:rascunho";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const isSameDayAsToday = (dateStr: string) => dateStr === todayStr();
const toDateStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

interface Draft {
  closingType: "partial" | "total";
  observations: string;
  remaining: RemainingStockMap;
  closingDate: string;
  savedAt: string;
}

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
  const [draftInfo, setDraftInfo] = useState<string | null>(null);

  const registrar = useRegistrarMovimentacao();
  const salvarFechamento = useSalvarFechamento();
  const { data: vendasPorData } = useVendasPorData(closingDate);
  const { data: saldo } = useSaldoPortaria();
  const { toast } = useToast();

  const isRetroactive = !isSameDayAsToday(closingDate);

  // Restaurar rascunho salvo (caso o usuário não tenha finalizado o fechamento)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: Draft = JSON.parse(raw);
      if (!draft?.remaining) return;
      setClosingType(draft.closingType || "partial");
      setObservations(draft.observations || "");
      setRemaining({ ...emptyRemainingStock(), ...draft.remaining });
      if (draft.closingDate) {
        setClosingDate(draft.closingDate);
        setSelectedDateObj(new Date(draft.closingDate + "T00:00:00"));
      }
      setDraftInfo(draft.savedAt);
    } catch {
      /* rascunho inválido, ignora */
    }
  }, []);

  // Salvar rascunho automaticamente
  useEffect(() => {
    const draft: Draft = {
      closingType,
      observations,
      remaining,
      closingDate,
      savedAt: new Date().toISOString(),
    };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        /* ignora */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [closingType, observations, remaining, closingDate]);

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

  // Divergências entre a contagem informada e o saldo do sistema
  const divergencias = useMemo(() => {
    if (isRetroactive || !saldo) return [];
    return PRODUCTS.map((p) => ({
      produto: produtoLabel(p),
      cheios: remaining[p].cheios - (saldo[p]?.cheios ?? 0),
      vazios: remaining[p].vazios - (saldo[p]?.vazios ?? 0),
    })).filter((d) => d.cheios !== 0 || d.vazios !== 0);
  }, [isRetroactive, saldo, remaining]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDateObj(date);
    if (date) {
      setClosingDate(toDateStr(date));
    }
  };

  const buildEstoque = () =>
    PRODUCTS.map((p) => {
      const vendas = isRetroactive
        ? p === "agua"
          ? selectedDateSales?.water ?? 0
          : selectedDateSales?.[p.toLowerCase() as "p13" | "p20" | "p45"] ?? 0
        : saldo?.[p]?.vendas_dia ?? 0;
      return {
        produto: produtoLabel(p),
        vendas,
        sistemaCheios: isRetroactive ? 0 : saldo?.[p]?.cheios ?? 0,
        contadoCheios: remaining[p].cheios,
        sistemaVazios: isRetroactive ? 0 : saldo?.[p]?.vazios ?? 0,
        contadoVazios: remaining[p].vazios,
      };
    });

  const handleGerarPdf = () => {
    const baseData = isRetroactive ? selectedDateCashierData : cashierData;
    gerarPdfFechamento({
      tipo: closingType,
      cashierData: baseData,
      observacoes: observations,
      dataFechamento: closingDate,
      estoque: buildEstoque(),
    });
    toast({
      title: "PDF gerado",
      description: "O relatório foi baixado. Imprima e coloque junto ao envelope.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (closingType === "total" && divergencias.length > 0 && !observations.trim()) {
      toast({
        title: "Divergência encontrada",
        description:
          "A contagem informada não bate com o estoque do sistema. Explique o motivo nas observações antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

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

    // Guarda o fechamento no histórico permanente
    try {
      await salvarFechamento.mutateAsync({
        data_fechamento: closingDate,
        tipo: closingType,
        cashierData: selectedDateCashierData,
        estoque: buildEstoque(),
        divergencias,
        observacoes: observations,
        retroativo: isRetroactive,
      });
    } catch {
      return;
    }

    // Gera automaticamente o PDF para imprimir e anexar ao envelope
    handleGerarPdf();

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignora */
    }
    setDraftInfo(null);

    onSubmit(closingType, observations, isRetroactive);
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

  const isSaving = registrar.isPending || salvarFechamento.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <ClosingTypeTabs
          type={closingType}
          setType={setClosingType}
          partialCount={partialClosings.length}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Data do fechamento:</span>
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                type="button"
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
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
              <Calendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                defaultMonth={selectedDateObj}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {draftInfo && (
        <Alert>
          <Save className="h-4 w-4" />
          <AlertDescription>
            Rascunho recuperado (salvo em{" "}
            {new Date(draftInfo).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}). Você
            pode continuar de onde parou.
          </AlertDescription>
        </Alert>
      )}

      {isRetroactive && (
        <Alert variant="warning" className="border-amber-500 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você está fechando o caixa de um dia anterior. Os valores exibidos são as vendas registradas
            naquela data. A contagem de estoque deve ser a que restou no final daquele dia.
          </AlertDescription>
        </Alert>
      )}

      {closingType === "total" && divergencias.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Divergência entre a contagem e o sistema</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 space-y-0.5 text-sm">
              {divergencias.map((d) => (
                <li key={d.produto}>
                  <strong>{d.produto}</strong>:{" "}
                  {d.cheios !== 0 && (
                    <span>
                      cheios {d.cheios > 0 ? `+${d.cheios}` : d.cheios}
                      {d.vazios !== 0 ? " · " : ""}
                    </span>
                  )}
                  {d.vazios !== 0 && <span>vazios {d.vazios > 0 ? `+${d.vazios}` : d.vazios}</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Explique o motivo no campo de observações para poder confirmar o fechamento.
            </p>
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

      <ClosingSalesEditor date={closingDate} />


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
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? "Registrando..."
            : closingType === "partial"
              ? "Confirmar Fechamento Parcial"
              : "Confirmar Fechamento Total"}
        </Button>
      </DialogFooter>
    </form>
  );
}
