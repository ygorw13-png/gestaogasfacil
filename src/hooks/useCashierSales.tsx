import { useState, useEffect, useCallback } from 'react';
import { CashierData } from '@/pages/entrance/types/cashierTypes';
import { Sale, SalesByType } from '@/pages/entrance/types/entranceTypes';
import { updateInventorySales } from '@/pages/entrance/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, FileText } from 'lucide-react';
import { useRegistrarMovimentacao, type PortariaProduto } from '@/pages/entrance/hooks/usePortariaStock';
import { useVendasHoje } from '@/pages/entrance/hooks/useVendasHoje';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { createPromissoryFromSale } from '@/lib/promissory';
import { G1_ACOES, acao, AcaoError } from '@/lib/g1/acoes';
import { ehIncerta, idDaChave } from '@/lib/g1/operacao';
import { normalizarTipoVenda } from '@/lib/saleTypes';
import { normalizarForma } from '@/lib/formasPagamento';
import { useOperacaoUnica } from '@/hooks/useOperacaoUnica';
import { hojePortaria } from '@/lib/g1/dataPortaria';

// Estado inicial do caixa - todos os valores zerados
export const initialCashierData: CashierData = {
  cash: 0,
  credit: 0,
  debit: 0,
  pix: 0,
  promissory: 0,
  gasVoucher: 0,
  totalSales: 0,
  quantities: {
    cash: { p13: 0, p20: 0, p45: 0, water: 0 },
    credit: { p13: 0, p20: 0, p45: 0, water: 0 },
    debit: { p13: 0, p20: 0, p45: 0, water: 0 },
    pix: { p13: 0, p20: 0, p45: 0, water: 0 },
    promissory: { p13: 0, p20: 0, p45: 0, water: 0 },
    gasVoucher: { p13: 0, p20: 0, p45: 0, water: 0 }
  },
  inventoryMovements: []
};

export const initialSalesByType: SalesByType[] = [
  { type: 'Dinheiro', amount: 0, icon: <DollarSign className="h-4 w-4 text-green-600" /> },
  { type: 'Crédito', amount: 0, icon: <CreditCard className="h-4 w-4 text-blue-600" /> },
  { type: 'Débito', amount: 0, icon: <CreditCard className="h-4 w-4 text-purple-600" /> },
  { type: 'PIX', amount: 0, icon: <CreditCard className="h-4 w-4 text-yellow-600" /> },
  { type: 'Promissória', amount: 0, icon: <FileText className="h-4 w-4 text-red-600" /> },
  { type: 'Vale Gás', amount: 0, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
  { type: 'Gás do Povo', amount: 0, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
  { type: 'Convênio', amount: 0, icon: <CreditCard className="h-4 w-4 text-orange-600" /> },
];

export function useCashierSales() {
  const { toast } = useToast();
  const registrarMov = useRegistrarMovimentacao();
  const queryClient = useQueryClient();
  const { data: vendasHoje } = useVendasHoje();
  const [cashierData, setCashierData] = useState<CashierData>(initialCashierData);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [glpSales, setGlpSales] = useState({
    p13: 0,
    p20: 0,
    p45: 0,
  });
  const [waterSales, setWaterSales] = useState(0);
  const [salesByType, setSalesByType] = useState<SalesByType[]>(initialSalesByType);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [hoursElapsed, setHoursElapsed] = useState(0);
  const [newSaleOpen, setNewSaleOpen] = useState(false);

  // Função para atualizar as horas decorridas
  const updateHoursElapsed = useCallback(() => {
    if (startTime) {
      const now = new Date();
      const elapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      setHoursElapsed(Math.max(elapsed, 1)); // At least 1 hour to avoid division by zero
    }
  }, [startTime]);

  // Calculate hours elapsed since first sale or since the start of the day
  useEffect(() => {
    if (!startTime && recentSales.length > 0) {
      // If there's no start time but we have sales, use the current time
      setStartTime(new Date());
    }

    // Update hours elapsed every minute
    const interval = setInterval(() => {
      updateHoursElapsed();
    }, 60000); // Update every minute

    // Execute once immediately to set initial value
    updateHoursElapsed();

    return () => clearInterval(interval);
  }, [startTime, recentSales.length, updateHoursElapsed]);

  // Sincroniza os totais da portaria com TODAS as vendas do dia registradas no banco
  // (venda na portaria, venda rápida, entregas concluídas e vendas na rua)
  useEffect(() => {
    if (!vendasHoje) return;
    setCashierData(prev => ({ ...prev, totalSales: vendasHoje.totalSales }));
    setRecentSales(vendasHoje.recentSales);
    setGlpSales(vendasHoje.glpSales);
    setWaterSales(vendasHoje.waterSales);
    setSalesByType(prev =>
      prev.map(item => ({ ...item, amount: vendasHoje.byPayment[item.type] || 0 }))
    );
    if (vendasHoje.firstSaleAt) {
      setStartTime(prev => prev || vendasHoje.firstSaleAt);
    }
  }, [vendasHoje]);

  // Uma venda por vez, com chave de reenvio presa ao conteúdo (ver src/lib/g1/operacao.ts).
  const operacao = useOperacaoUnica('venda-caixa');

  /**
   * Registra a venda e SÓ resolve depois da gravação confirmada. Em falha, rejeita (o formulário
   * mantém os dados). Quem chama fecha, limpa e imprime somente depois da resolução.
   */
  const handleNewSaleSubmit = useCallback(async (newSale: Sale, saleDate?: string): Promise<void> => {
    const hojeStr = hojePortaria();
    // Data em que a venda deve ser registrada (permite lançar em fechamento retroativo)
    const dataVenda = saleDate && saleDate !== hojeStr ? saleDate : null;

    const tipoVenda = normalizarTipoVenda(newSale.tipoVenda) ?? 'completa';
    const isVasilhame = tipoVenda === 'vasilhame';

    // Movimentação de vasilhames desta venda
    const vasilhamesEntregues = isVasilhame
      ? newSale.quantity
      : tipoVenda === 'completa'
      ? newSale.quantity
      : 0;
    const vasilhamesRecebidos =
      tipoVenda === 'recarga'
        ? Math.max(
            newSale.quantity,
            newSale.cylinderMovement === 'return' ? newSale.movementQuantity ?? 0 : 0
          )
        : newSale.cylinderMovement === 'return'
        ? newSale.movementQuantity ?? 0
        : 0;

    // Código único da forma escolhida (o mesmo gravado no banco). Desconhecida = erro, nunca outra forma.
    const paymentCode = newSale.resellerId ? null : normalizarForma(newSale.paymentCode ?? newSale.payment);
    if (!newSale.resellerId && !paymentCode) throw new Error('Forma de pagamento inválida. Selecione uma das opções da lista.');
    // null = valor não informado (só vale-gás, Gás do Povo e convênio; o banco recusa nas demais).
    const valor: number | null = newSale.valorInformado === false ? null : newSale.amount;

    // Conteúdo que identifica ESTA venda (não inclui o id/hora gerados a cada clique).
    const agregadoId = newSale.resellerId ?? null;
    const conteudo = {
      agregado: agregadoId,
      cliente: newSale.clientId ?? newSale.client, produto: newSale.product, codigo: newSale.productCode ?? null,
      quantidade: newSale.quantity, valor, pagamento: paymentCode, tipoVenda,
      movimento: newSale.cylinderMovement ?? 'none', movimentoQtd: newSale.movementQuantity ?? 0, dataVenda,
    };

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) throw new Error('Sessão expirada. Entre novamente para registrar a venda.');

    await operacao.executar(conteudo, async (chave) => {
      if (agregadoId) {
        // Retirada de agregado: pedido, saída do estoque e conta quantitativa numa transação, sem preço.
        if (!G1_ACOES) throw new Error('Retirada de agregado exige as ações controladas ligadas.');
        if (dataVenda) throw new Error('Retirada de agregado só na data de hoje.');
        await acao('retirada_agregado', {
          _reseller_id: agregadoId, _produto: newSale.product, _quantidade: newSale.quantity, _tipo_venda: tipoVenda,
          _vasilhames_recebidos: vasilhamesRecebidos, _comodato: newSale.cylinderMovement === 'loan',
          _observacoes: null, _chave: chave,
        });
        return;
      }
      if (G1_ACOES) {
        if (dataVenda) throw new Error('Lançamento retroativo ainda sem regra na ação controlada. Use a correção administrativa.');
        if (paymentCode === 'promissoria' && !(valor && valor > 0)) {
          throw new Error('Informe um valor maior que zero para Nota promissória.');
        }
        await acao('venda_portaria', {
          _cliente_id: newSale.clientId || null, _cliente_nome: newSale.client, _produto: newSale.product,
          _quantidade: newSale.quantity, _valor: valor, _forma: paymentCode,
          _tipo_venda: tipoVenda, _devolveu_vazio: newSale.cylinderMovement !== 'loan',
          _reseller_id: null, _observacoes: isVasilhame ? 'Venda de vasilhame vazio na portaria' : 'Venda registrada na portaria',
          _vasilhames_recebidos: vasilhamesRecebidos, _comodato: newSale.cylinderMovement === 'loan',
          _chave: chave,
        });
        return;
      }

      // ── Caminho antigo (G1 desligado): o id vem da chave, então um reenvio bate na chave primária.
      const orderId = idDaChave(chave);
      const now = dataVenda ? new Date(`${dataVenda}T12:00:00`).toISOString() : new Date().toISOString();
      const { error: insErr } = await supabase.from('orders').insert({
        id: orderId,
        user_id: userId,
        client_name: newSale.client,
        client_id: newSale.clientId || null,
        address: {},
        product: newSale.product,
        quantity: newSale.quantity,
        price: valor,
        payment_method: paymentCode,
        status: 'delivered',
        delivered_at: now,
        origem_venda: 'portaria',
        tipo_venda: tipoVenda,
        vasilhames_entregues: vasilhamesEntregues,
        vasilhames_recebidos: vasilhamesRecebidos,
        has_empty_cylinder: newSale.cylinderMovement !== 'loan',
        notes: `${
          isVasilhame ? 'Venda de vasilhame vazio na portaria' : 'Venda registrada na portaria'
        }${dataVenda ? ` (lançada no fechamento de ${dataVenda.split('-').reverse().join('/')})` : ''}`,
      } as any);
      // 23505 = esta mesma venda já foi gravada numa tentativa anterior: segue para o que faltou.
      if (insErr && insErr.code !== '23505') throw new AcaoError(insErr.message, ehIncerta(insErr));

      const faltou = (o: string) =>
        new AcaoError(`Venda salva, mas ${o}. Toque em Registrar de novo para completar (não duplica a venda).`, true);

      // Estoque da portaria (uma vez por venda: confere antes se já existe movimento desta venda)
      const { data: jaMov, error: movQErr } = await supabase
        .from('movimentacoes_portaria').select('id').eq('referencia_id', orderId).limit(1);
      if (movQErr) throw faltou('não foi possível conferir o estoque da portaria');
      if (!jaMov || jaMov.length === 0) {
        const codeToProduto: Record<string, PortariaProduto> = { p13: 'P13', p20: 'P20', p45: 'P45', water: 'agua' };
        const produto = isVasilhame ? 'P13' : newSale.productCode ? codeToProduto[newSale.productCode] : undefined;
        if (produto) {
          const isLoan = newSale.cylinderMovement === 'loan';
          try {
            await registrarMov.mutateAsync(
              isVasilhame
                ? {
                    tipo: 'venda', produto, delta_cheios: 0, delta_vazios: -newSale.quantity, delta_emprestados: 0,
                    cliente_id: newSale.clientId || null,
                    cliente_nome: newSale.client !== 'Venda Avulsa' ? newSale.client : null,
                    referencia_id: orderId,
                    observacoes: `Venda de vasilhame vazio P13 #${newSale.id} - ${newSale.payment}`,
                    ...(dataVenda ? { data_operacao: dataVenda } : {}),
                  }
                : {
                    tipo: isLoan ? 'venda_comodato' : 'venda', produto,
                    delta_cheios: -newSale.quantity,
                    delta_vazios: isLoan ? 0 : vasilhamesRecebidos,
                    delta_emprestados: isLoan ? newSale.quantity : 0,
                    cliente_id: newSale.clientId || null,
                    cliente_nome: newSale.client !== 'Venda Avulsa' ? newSale.client : null,
                    referencia_id: orderId,
                    observacoes: `Venda #${newSale.id} - ${newSale.payment}`,
                    ...(dataVenda ? { data_operacao: dataVenda } : {}),
                  },
            );
          } catch {
            throw faltou('o estoque da portaria não foi atualizado');
          }
        }
      }

      // Venda a prazo: nota promissória com vencimento em 30 dias (createPromissoryFromSale não duplica por venda)
      if (newSale.payment === 'Promissória') {
        const { error: pnError } = await createPromissoryFromSale({
          clientId: newSale.clientId || null,
          clientName: newSale.client,
          value: newSale.amount,
          referenceId: orderId,
          description: `Venda na portaria - ${newSale.quantity}x ${newSale.product}`,
        });
        if (pnError) throw faltou('a nota promissória não foi criada');
      }
    });

    // ── A partir daqui a gravação está confirmada.
    setStartTime(prevStartTime => prevStartTime ?? new Date());
    if (!isVasilhame) {
      // contadores locais legados (mock) — só depois de confirmar
      if (newSale.product.includes('P13')) updateInventorySales('P13', newSale.quantity);
      else if (newSale.product.includes('P20')) updateInventorySales('P20', newSale.quantity);
      else if (newSale.product.includes('P45')) updateInventorySales('P45', newSale.quantity);
      else if (newSale.product.includes('Água')) updateInventorySales('Água', newSale.quantity);
    }
    ['vendas_hoje', 'vendas_por_data', 'relatorio-vasilhames', 'promissory_notes', 'sales_history',
      'estoque_retirado', 'saldo_portaria_atual', 'dashboard', 'agregado-conta'].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] }));
    toast({
      title: 'Venda registrada',
      description: !G1_ACOES ? 'A venda foi registrada com sucesso.'
        : agregadoId ? 'Retirada do agregado e estoque gravados juntos. Valor fica para o acerto do administrador.'
        : valor === null ? 'Venda e estoque gravados. Valor não informado: nenhum recebimento foi lançado.'
        : 'Venda, estoque e recebimento gravados juntos.',
    });
    setNewSaleOpen(false);
  }, [toast, registrarMov, queryClient, operacao]);

  return {
    cashierData,
    setCashierData,
    recentSales,
    setRecentSales,
    glpSales,
    setGlpSales,
    waterSales, 
    setWaterSales,
    salesByType,
    setSalesByType,
    startTime,
    setStartTime,
    hoursElapsed,
    setHoursElapsed,
    newSaleOpen,
    setNewSaleOpen,
    handleNewSaleSubmit,
    salvandoVenda: operacao.enviando,
    duvidaVenda: operacao.duvida,
    descartarDuvidaVenda: operacao.descartarDuvida,
  };
}
