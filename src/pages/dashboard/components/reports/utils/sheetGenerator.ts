
import * as xlsx from 'xlsx';
import { excelStyles } from './excelStyles';
import { ReportData } from './reportTypes';
import { formatCurrency } from '@/lib/formatUtils';

const naoDisponivel = "Não disponível (custos não registrados)";

export const generateResumoSheet = (workbook: xlsx.WorkBook, reportData: ReportData) => {
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
    [`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`]
  ];

  const ws = xlsx.utils.aoa_to_sheet(resumoData);
  applySheetStyles(ws, resumoData.length);
  xlsx.utils.book_append_sheet(workbook, ws, "Resumo Executivo");
};

export const generateProdutosSheet = (workbook: xlsx.WorkBook, reportData: ReportData) => {
  const produtosData = [
    ["ANÁLISE DE PRODUTOS"],
    [""],
    ["Produto", "Quantidade Vendida", "Participação nas Vendas"],
    ...reportData.produtosMaisVendidos.map(p => [p.produto, p.quantidade, p.percentual])
  ];

  const ws = xlsx.utils.aoa_to_sheet(produtosData);
  applySheetStyles(ws, produtosData.length);
  xlsx.utils.book_append_sheet(workbook, ws, "Análise de Produtos");
};

export const generateVendasSheet = (workbook: xlsx.WorkBook, reportData: ReportData) => {
  const vendasData = [
    ["DETALHAMENTO DE VENDAS DIÁRIAS"],
    [""],
    ["Data", "Valor (R$)"],
    ...reportData.vendasDiarias.map(day => [
      day.data,
      formatCurrency(day.valor)
    ])
  ];

  const ws = xlsx.utils.aoa_to_sheet(vendasData);
  applySheetStyles(ws, vendasData.length);
  xlsx.utils.book_append_sheet(workbook, ws, "Vendas Diárias");
};

const applySheetStyles = (ws: xlsx.WorkSheet, totalRows: number) => {
  // Configure column widths
  const colWidths = [{ wch: 30 }, { wch: 25 }, { wch: 22 }];
  ws['!cols'] = colWidths;

  // Configure row heights
  const rowHeights: Array<{ hpt: number }> = Array(totalRows).fill({ hpt: 20 });
  rowHeights[0] = { hpt: 30 }; // Title row height
  ws['!rows'] = rowHeights;

  // Apply cell styles
  const range = xlsx.utils.decode_range(ws['!ref'] || "A1");
  
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = xlsx.utils.encode_cell({ r: row, c: col });
      if (!ws[cellRef]) continue;

      if (row === 0) {
        ws[cellRef].s = excelStyles.titleStyle;
      } else if (
        (ws[cellRef].v === "MÉTRICAS PRINCIPAIS") ||
        (ws[cellRef].v === "DESEMPENHO FINANCEIRO") ||
        (ws[cellRef].v === "RECOMENDAÇÕES ESTRATÉGICAS") ||
        (row === 2 && col === 0)
      ) {
        ws[cellRef].s = excelStyles.headerStyle;
      } else if (
        typeof ws[cellRef].v === 'string' &&
        (ws[cellRef].v.startsWith('R$') || ws[cellRef].v.includes('%'))
      ) {
        ws[cellRef].s = excelStyles.dataStyle;
      } else if (
        row >= 16 && row <= 20 && col === 0
      ) {
        ws[cellRef].s = excelStyles.highlightStyle;
      } else if (row === range.e.r) {
        ws[cellRef].s = excelStyles.footerStyle;
      } else {
        ws[cellRef].s = excelStyles.dataStyle;
      }
    }
  }
};

