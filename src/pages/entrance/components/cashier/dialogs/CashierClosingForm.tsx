import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ObservationsSection } from "../../ObservationsSection";
import { useEffect, useMemo, useState } from "react";
import { FileText, CalendarIcon, AlertTriangle, Save, Loader2 } from "lucide-react";
import { ClosingTypeTabs } from "../ClosingTypeTabs";
import { CashierData, PartialClosing } from "../../../types/cashierTypes";
import { SummarySection } from "./SummarySection";
import { ClosingSalesEditor } from "./ClosingSalesEditor";
import { PaymentBreakdownPanel } from "./PaymentBreakdownPanel";
import { prepareAdaptedSalesData, buildCashierDataFromVendasPorData } from "../../../utils/closingCalculations";
import { gerarPdfFechamento } from "../../../utils/closingPdf";
import {
  RemainingStockSection,
  emptyRemainingStock,
  type RemainingStockMap,
} from "./RemainingStockSection";
import {
  useRegistrarMovimentacao,
  useSaldoPortariaDia,
  produtoLabel,
  type PortariaProduto,
} from "../../../hooks/usePortariaStock";
import { useVendasPorData } from "../../../hooks/useVendasPorData";
import { useResumoPagamentos } from "../../../hooks/useResumoPagamentos";
import { useDespesasPorData } from "../../../hooks/useDespesasPorData";
import { useSalvarFechamento, useFechamentoPorData } from "../../../hooks/useFechamentosCaixa";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { hojePortaria } from "@/lib/g1/dataPortaria";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { acao, G1_ACOES } from "@/lib/g1/acoes";
import { numeroPedido } from "@/lib/entregas";

interface EntregaBloqueando { id: string; client_name: string; status: string; data_prevista: string; entregador_nome: string | null }
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

// Dia da portaria (mesmo dia que o banco usa; ver src/lib/g1/dataPortaria.ts).
const todayStr = () => hojePortaria();
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
  const [motivoAlteracao, setMotivoAlteracao] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);


  const registrar = useRegistrarMovimentacao();
  const salvarFechamento = useSalvarFechamento();
  const { data: vendasPorData, refetch: refetchVendasPorData } = useVendasPorData(closingDate);
  const { data: saldo } = useSaldoPortariaDia(closingDate);
  const { data: fechamentoExistente } = useFechamentoPorData(closingDate);
  const { categorias, agregados, totalAgregadosQtd, totalAgregadosValor, totalAgregadosProdutos } =
    useResumoPagamentos(closingDate);
  const { data: despesasDia = [] } = useDespesasPorData(closingDate);
  const { toast } = useToast();


  const isRetroactive = !isSameDayAsToday(closingDate);

  // Fechamento total: entregas realmente abertas com previsão para o dia ou o dia anterior impedem.
  // O banco confere de novo, com trava, na gravação; aqui é só para mostrar quais são.
  const bloqueio = useQuery({
    queryKey: ["entregas-bloqueando-fechamento", closingDate],
    enabled: G1_ACOES && closingType === "total",
    queryFn: () => acao<EntregaBloqueando[]>("entregas_bloqueando_fechamento", { _data: closingDate }),
    refetchInterval: 30_000,
  });
  const bloqueioTotal = G1_ACOES && closingType === "total" && (bloqueio.isLoading || bloqueio.isError || (bloqueio.data?.length ?? 0) > 0);

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

  // Dia atual e retroativo usam a mesma fonte (vendas entregues no dia, com
  // divisão por forma de pagamento). O estado local do caixa só guarda o total.
  const selectedDateCashierData = useMemo(
    () =>
      vendasPorData || isRetroactive
        ? buildCashierDataFromVendasPorData(vendasPorData)
        : cashierData,
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
    if (!saldo) return [];
    return PRODUCTS.map((p) => ({
      produto: produtoLabel(p),
      cheios: remaining[p].cheios - (saldo[p]?.esperado_cheios ?? 0),
      vazios: remaining[p].vazios - (saldo[p]?.esperado_vazios ?? 0),
    })).filter((d) => d.cheios !== 0 || d.vazios !== 0);
  }, [saldo, remaining]);

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
        sistemaCheios: saldo?.[p]?.esperado_cheios ?? 0,
        contadoCheios: remaining[p].cheios,
        sistemaVazios: saldo?.[p]?.esperado_vazios ?? 0,
        contadoVazios: remaining[p].vazios,
      };
    });

  const buildMovimento = () =>
    PRODUCTS.map((p) => {
      const s = saldo?.[p];
      return {
        produto: produtoLabel(p),
        aberturaCheios: s?.abertura_cheios ?? 0,
        aberturaVazios: s?.abertura_vazios ?? 0,
        patioRecebidoCheios: s?.patio_recebido_cheios ?? 0,
        patioEnviadoCheios: s?.patio_enviado_cheios ?? 0,
        patioVazios: s?.patio_vazios ?? 0,
        devolucoesVazios: s?.devolucoes_vazios ?? 0,
        vendas: s?.vendas_dia ?? 0,
      };
    });

  const handleGerarPdf = (data?: CashierData) => {
    const baseData = data ?? selectedDateCashierData;
    gerarPdfFechamento({
      tipo: closingType,
      cashierData: baseData,
      observacoes: observations,
      motivoAlteracao: fechamentoExistente ? motivoAlteracao : undefined,
      dataFechamento: closingDate,
      estoque: buildEstoque(),
      categorias: categorias
        .filter((c) => !c.agregado)
        .map((c) => ({
          label: c.label,
          quantidade: c.quantidade,
          valor: c.valor,
          produtos: c.produtos,
        })),
      agregados:
        agregados.length > 0
          ? {
              quantidade: totalAgregadosQtd,
              valor: totalAgregadosValor,
              produtos: totalAgregadosProdutos,
            }
          : undefined,
      despesas: despesasDia.map((d) => ({
        descricao: d.descricao,
        categoria: d.categoria,
        origem: d.origem_dinheiro,
        valor: d.valor,
      })),
      movimento: buildMovimento(),
    });
    toast({
      title: "PDF gerado",
      description: "O relatório foi baixado. Imprima e coloque junto ao envelope.",
    });
  };


  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      // Evita que o submit de formulários internos (ex.: lançar venda) feche o caixa
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
    }

    if (submitting) return;

    if (closingType === "total" && G1_ACOES) {
      const r = await bloqueio.refetch();
      if (r.error || !r.data) {
        toast({ title: "Fechamento total não liberado", description: "Não foi possível conferir as entregas em aberto. Nada foi salvo.", variant: "destructive" });
        return;
      }
      if (r.data.length > 0) {
        toast({ title: "Fechamento total bloqueado", description: `${r.data.length} entrega(s) em aberto. Resolva em Pedidos.`, variant: "destructive" });
        return;
      }
    }


    if (fechamentoExistente && motivoAlteracao.trim().length < 5) {
      toast({
        title: "Motivo obrigatório",
        description:
          "Já existe um fechamento salvo nesta data. Informe o motivo da alteração antes de salvar novamente.",
        variant: "destructive",
      });
      return;
    }

    if (closingType === "total" && divergencias.length > 0 && !observations.trim()) {
      toast({
        title: "Divergência encontrada",
        description:
          "A contagem informada não bate com o estoque do sistema. Explique o motivo nas observações antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: closingType === "total" ? "Fechando o caixa..." : "Registrando fechamento parcial...",
      description: "Aguarde enquanto salvamos os dados e geramos o PDF.",
    });

    // Retrato no instante de corte: relê as vendas do dia agora. Se a leitura
    // falhar, nada é gravado (não salvar zeros como se fossem o caixa real).
    const fresh = await refetchVendasPorData();
    if (fresh.error || !fresh.data) {
      setSubmitting(false);
      toast({
        title: "Não foi possível ler as vendas do dia",
        description: "Nada foi salvo. Verifique a conexão e tente novamente.",
        variant: "destructive",
      });
      return;
    }
    const snapshot = buildCashierDataFromVendasPorData(fresh.data);

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
        setSubmitting(false);
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
        cashierData: snapshot,
        estoque: buildEstoque(),
        divergencias,
        observacoes: fechamentoExistente
          ? `${observations}${observations ? "\n" : ""}[Alteração após fechamento] ${motivoAlteracao}`
          : observations,
        retroativo: isRetroactive,
      });
    } catch (err: any) {
      setSubmitting(false);
      toast({
        title: "Erro ao salvar fechamento",
        description: err?.message || "Não foi possível salvar. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    // Gera automaticamente o PDF para imprimir e anexar ao envelope
    handleGerarPdf(snapshot);

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignora */
    }
    setDraftInfo(null);
    setSubmitting(false);

    toast({
      title: closingType === "total" ? "Caixa fechado com sucesso" : "Fechamento parcial salvo",
      description: `Fechamento de ${format(new Date(closingDate + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} salvo no histórico e PDF baixado.`,
    });

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

  const isSaving = submitting || registrar.isPending || salvarFechamento.isPending;

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
        date={closingDate}
      />

      <ClosingSalesEditor date={closingDate} />

      <PaymentBreakdownPanel date={closingDate} />


      {closingType === "total" && (
        <RemainingStockSection value={remaining} onChange={setRemaining} date={closingDate} />
      )}

      {fechamentoExistente && (
        <div className="space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
          <Label htmlFor="motivo-alteracao" className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Motivo da alteração (obrigatório)
          </Label>
          <p className="text-xs text-muted-foreground">
            Esta data já possui um fechamento salvo em{" "}
            {new Date(fechamentoExistente.created_at).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            . Explique o motivo — ele será impresso no PDF.
          </p>
          <Textarea
            id="motivo-alteracao"
            value={motivoAlteracao}
            onChange={(e) => setMotivoAlteracao(e.target.value)}
            placeholder="Ex.: venda lançada com atraso pelo entregador"
            className="min-h-[70px] resize-none"
          />
        </div>
      )}

      {closingType === "total" && G1_ACOES && (bloqueio.isLoading ? (
        <p className="text-sm text-muted-foreground">Conferindo entregas em aberto…</p>
      ) : bloqueio.isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível conferir as entregas em aberto</AlertTitle>
          <AlertDescription>O fechamento total fica bloqueado até a consulta funcionar. O fechamento parcial continua disponível.</AlertDescription>
        </Alert>
      ) : (bloqueio.data?.length ?? 0) > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fechamento total bloqueado: {bloqueio.data!.length} entrega(s) em aberto</AlertTitle>
          <AlertDescription>
            <p className="text-sm">Entregas de {format(new Date(closingDate + "T00:00:00"), "dd/MM", { locale: ptBR })} ou do dia anterior ainda não foram concluídas nem canceladas. Nada é concluído ou reagendado automaticamente.</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {bloqueio.data!.slice(0, 8).map((e) => (
                <li key={e.id}>
                  <Link to={`/orders/${e.id}`} className="font-mono underline">{numeroPedido(e.id)}</Link> · {e.client_name}
                  {e.entregador_nome ? ` · ${e.entregador_nome}` : " · sem entregador"}
                </li>
              ))}
            </ul>
            <Link to="/orders?filtro=operacional" className="mt-2 inline-block text-sm font-medium underline">Abrir em Pedidos</Link>
          </AlertDescription>
        </Alert>
      ) : null)}

      <ObservationsSection value={observations} onChange={setObservations} />

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="secondary" onClick={() => handleGerarPdf()} className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar PDF
        </Button>
        <Button type="button" onClick={() => handleSubmit()} disabled={isSaving || bloqueioTotal} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving
            ? "Registrando fechamento..."
            : closingType === "partial"
              ? "Confirmar Fechamento Parcial"
              : "Confirmar Fechamento Total"}
        </Button>

      </DialogFooter>
    </form>
  );
}
