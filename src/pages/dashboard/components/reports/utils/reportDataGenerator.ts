
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateReportData = (dateRange: DateRange) => {
  const from = dateRange.from!;
  const to = dateRange.to || dateRange.from!;
  
  // Dados simulados de vendas diárias no período
  const dailySales: { data: string; valor: number }[] = [];
  let currentDate = new Date(from);
  
  while (currentDate <= to) {
    const formattedDate = format(currentDate, "dd/MM/yyyy", { locale: ptBR });
    // Gera um valor aleatório entre 800 e 2500 para as vendas diárias
    const randomSales = Math.round(800 + Math.random() * 1700);
    dailySales.push({ data: formattedDate, valor: randomSales });
    
    // Avança para o próximo dia
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calcula totais e médias
  const totalSales = dailySales.reduce((sum, day) => sum + day.valor, 0);
  const averageSales = totalSales / dailySales.length;
  
  // Produtos mais vendidos (dados simulados)
  const topProducts = [
    { produto: "Água Mineral 20L", quantidade: Math.round(dailySales.length * 25 * (0.8 + Math.random() * 0.4)), percentual: "35%" },
    { produto: "Água Mineral 10L", quantidade: Math.round(dailySales.length * 18 * (0.8 + Math.random() * 0.4)), percentual: "25%" },
    { produto: "Água Mineral 5L", quantidade: Math.round(dailySales.length * 15 * (0.8 + Math.random() * 0.4)), percentual: "20%" },
    { produto: "Água Mineral 1.5L", quantidade: Math.round(dailySales.length * 12 * (0.8 + Math.random() * 0.4)), percentual: "15%" },
    { produto: "Água Mineral 500ml", quantidade: Math.round(dailySales.length * 5 * (0.8 + Math.random() * 0.4)), percentual: "5%" },
  ];
  
  // Métricas financeiras
  const financialMetrics = {
    receitaBruta: totalSales,
    custoOperacional: totalSales * 0.45,
    margemLucro: 55,
    taxaCrescimento: 4.3,
  };
  
  // Sugestões baseadas nos dados
  const suggestions = [
    "Aumente o estoque de Água Mineral 20L em 15% para atender à demanda crescente.",
    `Considere uma promoção para Água Mineral 500ml, que representa apenas ${topProducts[4].percentual} das vendas.`,
    `A margem de lucro atual de ${financialMetrics.margemLucro}% está acima da média do setor. Considere estratégias para manter este desempenho.`,
    "Implemente um programa de fidelidade para clientes frequentes para aumentar a retenção.",
    `A taxa de crescimento de ${financialMetrics.taxaCrescimento}% indica uma tendência positiva. Considere expandir para novas áreas.`
  ];
  
  return {
    periodo: {
      inicio: format(from, "dd/MM/yyyy", { locale: ptBR }),
      fim: format(to, "dd/MM/yyyy", { locale: ptBR })
    },
    vendasDiarias: dailySales,
    totais: {
      vendasTotais: totalSales,
      mediaDiaria: averageSales,
      diasAnalisados: dailySales.length
    },
    produtosMaisVendidos: topProducts,
    metricasFinanceiras: financialMetrics,
    sugestoes: suggestions
  };
};
