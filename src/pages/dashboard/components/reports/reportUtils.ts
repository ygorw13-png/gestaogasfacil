
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para gerar dados de exemplo para o relatório
const generateReportData = (dateRange: DateRange) => {
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

// Função para criar um arquivo Excel com os dados do relatório
export const generateExcelReport = async (dateRange: DateRange): Promise<Blob> => {
  // Simula a geração do arquivo Excel
  // Em uma implementação real, você usaria uma biblioteca como ExcelJS ou xlsx
  
  // Gera dados de exemplo para o relatório
  const reportData = generateReportData(dateRange);
  
  // Em uma aplicação real, você usaria algo como:
  // const workbook = new ExcelJS.Workbook();
  // const worksheet = workbook.addWorksheet('Relatório de Vendas');
  // ... adicionar dados ao worksheet ...
  // return workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  
  // Por enquanto, vamos simular a criação do arquivo usando um blob de texto
  const reportContent = `
RELATÓRIO MENSAL GASFLOW AQUA

Período: ${reportData.periodo.inicio} a ${reportData.periodo.fim}

RESUMO EXECUTIVO:
Total de Vendas: R$ ${reportData.totais.vendasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Média Diária: R$ ${reportData.totais.mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Dias Analisados: ${reportData.totais.diasAnalisados}

PRODUTOS MAIS VENDIDOS:
1. ${reportData.produtosMaisVendidos[0].produto}: ${reportData.produtosMaisVendidos[0].quantidade} unidades (${reportData.produtosMaisVendidos[0].percentual})
2. ${reportData.produtosMaisVendidos[1].produto}: ${reportData.produtosMaisVendidos[1].quantidade} unidades (${reportData.produtosMaisVendidos[1].percentual})
3. ${reportData.produtosMaisVendidos[2].produto}: ${reportData.produtosMaisVendidos[2].quantidade} unidades (${reportData.produtosMaisVendidos[2].percentual})
4. ${reportData.produtosMaisVendidos[3].produto}: ${reportData.produtosMaisVendidos[3].quantidade} unidades (${reportData.produtosMaisVendidos[3].percentual})
5. ${reportData.produtosMaisVendidos[4].produto}: ${reportData.produtosMaisVendidos[4].quantidade} unidades (${reportData.produtosMaisVendidos[4].percentual})

MÉTRICAS FINANCEIRAS:
Receita Bruta: R$ ${reportData.metricasFinanceiras.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Custo Operacional: R$ ${reportData.metricasFinanceiras.custoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Margem de Lucro: ${reportData.metricasFinanceiras.margemLucro}%
Taxa de Crescimento: ${reportData.metricasFinanceiras.taxaCrescimento}%

SUGESTÕES DE OTIMIZAÇÃO:
- ${reportData.sugestoes[0]}
- ${reportData.sugestoes[1]}
- ${reportData.sugestoes[2]}
- ${reportData.sugestoes[3]}
- ${reportData.sugestoes[4]}

DETALHAMENTO DE VENDAS DIÁRIAS:
${reportData.vendasDiarias.map(day => `${day.data}: R$ ${day.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n')}

Relatório gerado automaticamente pelo sistema GasFlow Aqua em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
`;

  // Esta é uma simulação - em uma aplicação real, você retornaria um arquivo Excel real
  // Para esta demonstração, retornamos um arquivo de texto simulando o conteúdo do Excel
  return new Promise(resolve => {
    // Simula um pequeno delay para parecer que está processando
    setTimeout(() => {
      const blob = new Blob([reportContent], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      resolve(blob);
    }, 500);
  });
};
