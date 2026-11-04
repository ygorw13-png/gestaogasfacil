
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatUtils";
import { generateReportData } from "./utils/reportDataGenerator";
import { excelStyles } from "./utils/excelStyles";

export const generateExcelReport = async (dateRange: DateRange): Promise<Blob> => {
  const reportData = await generateReportData(dateRange);
  const xlsx = await import('xlsx');

  const naoDisponivel = "Não disponível (custos não registrados)";

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
    ["Pedidos no Período", reportData.totais.pedidos],
    [""],
    ["DESEMPENHO FINANCEIRO"],
    ["Receita Bruta", `R$ ${formatCurrency(reportData.metricasFinanceiras.receitaBruta)}`],
    ["Custo Operacional", naoDisponivel],
    ["Margem de Lucro", naoDisponivel],
    ["Taxa de Crescimento", naoDisponivel],
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
    const rowHeights: Array<{ hpt: number }> = [];
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
          ws[cellRef].s = excelStyles.titleStyle;
        }
        // Estilo dos cabeçalhos de seções
        else if (
          (data[row] && data[row][0] === "MÉTRICAS PRINCIPAIS") || 
          (data[row] && data[row][0] === "DESEMPENHO FINANCEIRO") || 
          (data[row] && data[row][0] === "RECOMENDAÇÕES ESTRATÉGICAS") ||
          (row === 2 && col === 0 && name === "Análise de Produtos") ||
          (row === 2 && col === 0 && name === "Vendas Diárias")
        ) {
          ws[cellRef].s = excelStyles.headerStyle;
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
          ws[cellRef].s = excelStyles.subHeaderStyle;
        }
        // Estilo para as recomendações
        else if (row >= 16 && row <= 20 && name === "Resumo Executivo") {
          ws[cellRef].s = excelStyles.dataStyle;
          // Destaque para os números das recomendações
          if (col === 0) ws[cellRef].s = excelStyles.highlightStyle;
        }
        // Estilo para datas e números
        else if (
          (name === "Vendas Diárias" && row > 2) || 
          (name === "Análise de Produtos" && row > 2) ||
          (row >= 5 && row <= 7 && col === 1) || 
          (row >= 10 && row <= 13 && col === 1)
        ) {
          if (col === 0 && name === "Vendas Diárias" && row > 2) {
            ws[cellRef].s = excelStyles.dateStyle;
          } else {
            ws[cellRef].s = excelStyles.dataStyle;
          }
        }
        // Rodapé do relatório
        else if (row === range.e.r && name === "Resumo Executivo") {
          ws[cellRef].s = excelStyles.footerStyle;
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
