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

  const handleNewSaleSubmit = useCallback((newSale: Sale) => {
    // Set start time if this is the first sale after reset
    setStartTime(prevStartTime => {
      if (!prevStartTime) {
        return new Date();
      }
      return prevStartTime;
    });
    
    const tipoVenda = newSale.tipoVenda || 'completa';
    const isVasilhame = tipoVenda === 'vasilhame';

    // Atualiza contadores locais de estoque (mock legado) — só para gás/água
    if (!isVasilhame) {
      if (newSale.product.includes('P13')) updateInventorySales('P13', newSale.quantity);
      else if (newSale.product.includes('P20')) updateInventorySales('P20', newSale.quantity);
      else if (newSale.product.includes('P45')) updateInventorySales('P45', newSale.quantity);
      else if (newSale.product.includes('Água')) updateInventorySales('Água', newSale.quantity);
    }

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

    // Persiste a venda da portaria em orders para entrar nos totais do dia
    const paymentCodeMap: Record<string, string> = {
      'Dinheiro': 'money',
      'Crédito': 'credit',
      'Débito': 'debit',
      'PIX': 'pix',
      'Promissória': 'promissoria',
      'Vale Gás': 'vale-gas',
      'Convênio': 'convenio',
    };
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (!userId) return;
        const now = new Date().toISOString();
        const { data: inserted } = await supabase.from('orders').insert({
          user_id: userId,
          client_name: newSale.client,
          client_id: newSale.clientId || null,
          address: {},
          product: newSale.product,
          quantity: newSale.quantity,
          price: newSale.amount,
          payment_method: paymentCodeMap[newSale.payment] || 'money',
          status: 'delivered',
          delivered_at: now,
          origem_venda: 'portaria',
          tipo_venda: tipoVenda,
          vasilhames_entregues: vasilhamesEntregues,
          vasilhames_recebidos: vasilhamesRecebidos,
          has_empty_cylinder: newSale.cylinderMovement !== 'loan',
          notes: isVasilhame
            ? 'Venda de vasilhame vazio na portaria'
            : 'Venda registrada na portaria',
        } as any).select('id').maybeSingle();

        // Venda a prazo: gera nota promissória com vencimento em 30 dias
        if (newSale.payment === 'Promissória') {
          const { error: pnError } = await createPromissoryFromSale({
            clientId: newSale.clientId || null,
            clientName: newSale.client,
            value: newSale.amount,
            referenceId: (inserted as any)?.id ?? null,
            description: `Venda na portaria - ${newSale.quantity}x ${newSale.product}`,
          });
          if (pnError) {
            toast({ title: 'Venda salva, promissória não criada', description: pnError, variant: 'destructive' });
          } else {
            toast({ title: 'Nota promissória gerada', description: `Vencimento em 30 dias — ${newSale.client}` });
          }
        }

        queryClient.invalidateQueries({ queryKey: ['vendas_hoje'] });
        queryClient.invalidateQueries({ queryKey: ['relatorio-vasilhames'] });
        queryClient.invalidateQueries({ queryKey: ['promissory_notes'] });
        queryClient.invalidateQueries({ queryKey: ['sales_history'] });
        queryClient.invalidateQueries({ queryKey: ['estoque_retirado'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      } catch (e) {
        console.error('Erro ao registrar venda no banco:', e);
      }
    })();
    
    // Registrar movimentação no estoque da portaria (Supabase)
    if (isVasilhame) {
      // Venda só do casco: sai um vasilhame vazio do estoque
      registrarMov.mutate({
        tipo: 'venda',
        produto: 'P13',
        delta_cheios: 0,
        delta_vazios: -newSale.quantity,
        delta_emprestados: 0,
        cliente_id: newSale.clientId || null,
        cliente_nome: newSale.client !== 'Venda Avulsa' ? newSale.client : null,
        observacoes: `Venda de vasilhame vazio P13 #${newSale.id} - ${newSale.payment}`,
      });
    } else {
      const codeToProduto: Record<string, PortariaProduto> = {
        p13: 'P13', p20: 'P20', p45: 'P45', water: 'agua',
      };
      const produto = newSale.productCode ? codeToProduto[newSale.productCode] : undefined;
      if (produto) {
        const isLoan = newSale.cylinderMovement === 'loan';
        registrarMov.mutate({
          tipo: isLoan ? 'venda_comodato' : 'venda',
          produto,
          delta_cheios: -newSale.quantity,
          delta_vazios: isLoan ? 0 : vasilhamesRecebidos,
          delta_emprestados: isLoan ? newSale.quantity : 0,
          cliente_id: newSale.clientId || null,
          cliente_nome: newSale.client !== 'Venda Avulsa' ? newSale.client : null,
          observacoes: `Venda #${newSale.id} - ${newSale.payment}`,
        });
      }
    }

    
    toast({
      title: "Venda registrada",
      description: "A venda foi registrada com sucesso.",
      variant: "default",
    });
    
    setNewSaleOpen(false);
  }, [toast, registrarMov, queryClient]);

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
    handleNewSaleSubmit
  };
}
