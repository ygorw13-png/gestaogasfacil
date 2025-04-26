
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

  // Configurações de estilo com cores GasFlow
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "22C55E" } }, // Verde GasFlow (gasflow-500)
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "15803D" } }, // gasflow-700
      bottom: { style: "thin", color: { rgb: "15803D" } },
      left: { style: "thin", color: { rgb: "15803D" } },
      right: { style: "thin", color: { rgb: "15803D" } }
    }
  };

  const titleStyle = {
    font: { bold: true, size: 14, color: { rgb: "166534" } }, // gasflow-800
    fill: { fgColor: { rgb: "F0FDF4" } }, // gasflow-50
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "15803D" } }, // gasflow-700
      bottom: { style: "medium", color: { rgb: "15803D" } },
      left: { style: "medium", color: { rgb: "15803D" } },
      right: { style: "medium", color: { rgb: "15803D" } }
    }
  };

  const subHeaderStyle = {
    font: { bold: true, color: { rgb: "166534" } }, // gasflow-800
    fill: { fgColor: { rgb: "DCFCE7" } }, // gasflow-100
    alignment: { horizontal: "left" },
    border: {
      top: { style: "thin", color: { rgb: "16A34A" } }, // gasflow-600
      bottom: { style: "thin", color: { rgb: "16A34A" } },
      left: { style: "thin", color: { rgb: "16A34A" } },
      right: { style: "thin", color: { rgb: "16A34A" } }
    }
  };

  const dataStyle = {
    font: { color: { rgb: "333333" } },
    border: {
      top: { style: "thin", color: { rgb: "BBBBBB" } },
      bottom: { style: "thin", color: { rgb: "BBBBBB" } },
      left: { style: "thin", color: { rgb: "BBBBBB" } },
      right: { style: "thin", color: { rgb: "BBBBBB" } }
    },
    alignment: { horizontal: "right", vertical: "center" }
  };

  const dateStyle = {
    font: { color: { rgb: "333333" } },
    border: {
      top: { style: "thin", color: { rgb: "BBBBBB" } },
      bottom: { style: "thin", color: { rgb: "BBBBBB" } },
      left: { style: "thin", color: { rgb: "BBBBBB" } },
      right: { style: "thin", color: { rgb: "BBBBBB" } }
    },
    alignment: { horizontal: "center", vertical: "center" }
  };
  
  const highlightStyle = {
    font: { bold: true, color: { rgb: "166534" } },
    fill: { fgColor: { rgb: "BBF7D0" } }, // gasflow-200
    border: {
      top: { style: "thin", color: { rgb: "16A34A" } },
      bottom: { style: "thin", color: { rgb: "16A34A" } },
      left: { style: "thin", color: { rgb: "16A34A" } },
      right: { style: "thin", color: { rgb: "16A34A" } }
    },
    alignment: { horizontal: "left", vertical: "center" }
  };

  const footerStyle = {
    font: { italic: true, color: { rgb: "666666" } },
    alignment: { horizontal: "right" }
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
    const colWidths = [{ wch: 30 }, { wch: 25 }, { wch: 22 }];
    ws['!cols'] = colWidths;
    
    // Ajustar alturas das linhas
    const rowHeights = {};
    rowHeights[0] = { hpt: 30 }; // Altura do título principal
    ws['!rows'] = rowHeights;

    // Mesclar células para o título principal
    if (data[0] && data[0][0]) {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    }

    // Aplicar estilos
    const range = xlsx.utils.decode_range(ws['!ref'] || "A1");
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) continue;

        // Estilo do título principal
        if (row === 0) {
          ws[cellRef].s = titleStyle;
        }
        // Estilo dos cabeçalhos de seções
        else if (
          (data[row] && data[row][0] === "MÉTRICAS PRINCIPAIS") || 
          (data[row] && data[row][0] === "DESEMPENHO FINANCEIRO") || 
          (data[row] && data[row][0] === "RECOMENDAÇÕES ESTRATÉGICAS") ||
          (row === 2 && col === 0 && name === "Análise de Produtos") ||
          (row === 2 && col === 0 && name === "Vendas Diárias")
        ) {
          ws[cellRef].s = headerStyle;
        }
        // Estilo dos subcabeçalhos ou labels importantes
        else if (
          (data[row] && 
           (data[row][0] === "Período de Análise:" || 
            data[row][0] === "Total de Vendas" || 
            data[row][0] === "Média Diária" || 
            data[row][0] === "Dias Analisados" || 
            data[row][0] === "Receita Bruta" || 
            data[row][0] === "Custo Operacional" || 
            data[row][0] === "Margem de Lucro" || 
            data[row][0] === "Taxa de Crescimento")) || 
          (row === 2 && name !== "Resumo Executivo")
        ) {
          ws[cellRef].s = subHeaderStyle;
        }
        // Estilo para as recomendações
        else if (row >= 16 && row <= 20 && name === "Resumo Executivo") {
          ws[cellRef].s = dataStyle;
          // Destaque para os números das recomendações
          if (col === 0) ws[cellRef].s = highlightStyle;
        }
        // Estilo para datas e números
        else if (
          (name === "Vendas Diárias" && row > 2) || 
          (name === "Análise de Produtos" && row > 2) ||
          (row >= 5 && row <= 7 && col === 1) || 
          (row >= 10 && row <= 13 && col === 1)
        ) {
          if (col === 0 && name === "Vendas Diárias" && row > 2) {
            ws[cellRef].s = dateStyle;
          } else {
            ws[cellRef].s = dataStyle;
          }
        }
        // Rodapé do relatório
        else if (row === range.e.r && name === "Resumo Executivo") {
          ws[cellRef].s = footerStyle;
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
