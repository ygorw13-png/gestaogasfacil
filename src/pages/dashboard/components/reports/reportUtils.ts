import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatUtils";

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

export const generateExcelReport = async (dateRange: DateRange): Promise<Blob> => {
  const reportData = generateReportData(dateRange);
  const xlsx = await import('xlsx');

  // Configurações de estilo
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "22C55E" } }, // Verde GasFlow
    alignment: { horizontal: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  };

  const subHeaderStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "F0FDF4" } }, // Verde claro
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  };

  const workbook = xlsx.utils.book_new();

  // Planilha de Resumo Executivo
  const resumoData = [
    ["RELATÓRIO MENSAL GASFLOW AQUA"],
    [""],
    ["Período de Análise:", `${reportData.periodo.inicio} a ${reportData.periodo.fim}`],
    [""],
    ["MÉTRICAS PRINCIPAIS"],
    ["Total de Vendas", `R$ ${formatCurrency(reportData.totais.vendasTotais)}`],
    ["Média Diária", `R$ ${formatCurrency(reportData.totais.mediaDiaria)}`],
    ["Dias Analisados", reportData.totais.diasAnalisados],
    [""],
    ["DESEMPENHO FINANCEIRO"],
    ["Receita Bruta", `R$ ${formatCurrency(reportData.metricasFinanceiras.receitaBruta)}`],
    ["Custo Operacional", `R$ ${formatCurrency(reportData.metricasFinanceiras.custoOperacional)}`],
    ["Margem de Lucro", `${reportData.metricasFinanceiras.margemLucro}%`],
    ["Taxa de Crescimento", `${reportData.metricasFinanceiras.taxaCrescimento}%`],
    [""],
    ["RECOMENDAÇÕES ESTRATÉGICAS"],
    ["1.", reportData.sugestoes[0]],
    ["2.", reportData.sugestoes[1]],
    ["3.", reportData.sugestoes[2]],
    ["4.", reportData.sugestoes[3]],
    ["5.", reportData.sugestoes[4]],
    [""],
    [`Relatório gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`]
  ];

  // Planilha de Produtos
  const produtosData = [
    ["ANÁLISE DE PRODUTOS"],
    [""],
    ["Produto", "Quantidade Vendida", "Participação nas Vendas"],
    ...reportData.produtosMaisVendidos.map(p => [p.produto, p.quantidade, p.percentual])
  ];

  // Planilha de Vendas Diárias
  const vendasData = [
    ["DETALHAMENTO DE VENDAS DIÁRIAS"],
    [""],
    ["Data", "Valor (R$)"],
    ...reportData.vendasDiarias.map(day => [
      day.data,
      formatCurrency(day.valor)
    ])
  ];

  // Adicionar e formatar as planilhas
  const addSheetWithStyles = (data: any[][], name: string) => {
    const ws = xlsx.utils.aoa_to_sheet(data);
    
    // Configurar larguras das colunas
    const colWidths = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];
    ws['!cols'] = colWidths;

    // Aplicar estilos
    const range = xlsx.utils.decode_range(ws['!ref'] || "A1");
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) continue;

        // Estilo do cabeçalho principal
        if (row === 0) {
          ws[cellRef].s = headerStyle;
        }
        // Estilo dos subcabeçalhos
        else if (data[row] && data[row][0] && !data[row][0].toString().match(/^\d/)) {
          ws[cellRef].s = subHeaderStyle;
        }
      }
    }

    xlsx.utils.book_append_sheet(workbook, ws, name);
  };

  addSheetWithStyles(resumoData, "Resumo Executivo");
  addSheetWithStyles(produtosData, "Análise de Produtos");
  addSheetWithStyles(vendasData, "Vendas Diárias");

  // Gerar arquivo Excel com as configurações aplicadas
  const excelBuffer = xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};
