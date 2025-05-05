
import * as xlsx from 'xlsx';
import { RouteReport } from "../data/mockRouteReports";

interface FilterOptions {
  startDate?: string;
  endDate?: string;
  driverId?: string;
}

// Estilos para o Excel
const excelStyles = {
  titleStyle: {
    font: { bold: true, size: 14, color: { rgb: "166534" } }, // verde escuro
    fill: { fgColor: { rgb: "F0FDF4" } }, // verde claro
    alignment: { horizontal: "center" }
  },
  headerStyle: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "22C55E" } }, // verde médio
    alignment: { horizontal: "center" }
  },
  subHeaderStyle: {
    font: { bold: true, color: { rgb: "166534" } },
    fill: { fgColor: { rgb: "DCFCE7" } }, // verde muito claro
    alignment: { horizontal: "left" }
  },
  dataStyle: {
    font: { color: { rgb: "333333" } },
    alignment: { horizontal: "right" }
  }
};

// Função para gerar relatório de uma rota específica
export const generateRouteDetailReport = async (report: RouteReport): Promise<Blob> => {
  const workbook = xlsx.utils.book_new();

  // Dados gerais da rota
  const generalData = [
    ["RELATÓRIO DETALHADO DE ROTA"],
    [""],
    ["Data:", new Date(report.date).toLocaleDateString('pt-BR')],
    ["Motorista:", report.driver],
    ["Destino:", report.destination],
    ["Total de vendas:", report.salesCount.toString()],
    ["Valor total:", `R$ ${report.totalAmount.toFixed(2)}`],
    [""],
    ["PRODUTOS VENDIDOS"],
    [""],
    ["Gás P13:", report.details.gasP13Sold.toString()],
    ["Gás P20:", report.details.gasP20Sold.toString()],
    ["Gás P45:", report.details.gasP45Sold.toString()],
    ["Água:", report.details.waterSold.toString()],
    [""],
  ];

  // Dados das vendas para clientes
  const salesData = [
    ["VENDAS REALIZADAS"],
    [""],
    ["Cliente", "Produtos", "Valor"]
  ];

  // Adicionar dados de cada venda
  report.details.clients.forEach(client => {
    salesData.push([
      client.name,
      client.items,
      `R$ ${client.value.toFixed(2)}`
    ]);
  });

  // Criar as planilhas
  const generalSheet = xlsx.utils.aoa_to_sheet(generalData);
  const salesSheet = xlsx.utils.aoa_to_sheet(salesData);

  // Aplicar estilos
  const applyStyles = (sheet: xlsx.WorkSheet, dataArray: any[][]) => {
    if (!sheet['!ref']) return;
    
    const range = xlsx.utils.decode_range(sheet['!ref']);
    
    for (let r = 0; r <= range.e.r; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cellAddress = xlsx.utils.encode_cell({ r, c });
        if (!sheet[cellAddress]) continue;
        
        // Título principal
        if (r === 0 && c === 0) {
          sheet[cellAddress].s = excelStyles.titleStyle;
        }
        // Cabeçalhos de seção
        else if ((dataArray[r] && dataArray[r][0] === "PRODUTOS VENDIDOS") || 
                 (dataArray[r] && dataArray[r][0] === "VENDAS REALIZADAS")) {
          sheet[cellAddress].s = excelStyles.subHeaderStyle;
        }
        // Cabeçalhos de colunas em tabelas
        else if ((r === 2 && dataArray[0][0] === "VENDAS REALIZADAS")) {
          sheet[cellAddress].s = excelStyles.headerStyle;
        }
        // Células de dados
        else {
          sheet[cellAddress].s = excelStyles.dataStyle;
        }
      }
    }
  };

  applyStyles(generalSheet, generalData);
  applyStyles(salesSheet, salesData);

  // Ajustar largura das colunas
  generalSheet['!cols'] = [{ wch: 15 }, { wch: 30 }];
  salesSheet['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 15 }];

  // Adicionar as planilhas ao workbook
  xlsx.utils.book_append_sheet(workbook, generalSheet, "Informações Gerais");
  xlsx.utils.book_append_sheet(workbook, salesSheet, "Vendas");

  // Gerar o arquivo Excel
  const excelBuffer = xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};

// Função para gerar relatório de múltiplas rotas
export const generateRoutesReport = async (reports: RouteReport[], filters: FilterOptions): Promise<Blob> => {
  const workbook = xlsx.utils.book_new();

  // Dados para a planilha principal de rotas
  const routesData = [
    ["RELATÓRIO DE ROTAS"],
    [""],
    ["Data de geração:", new Date().toLocaleDateString('pt-BR')],
    ["Filtros aplicados:", 
      `${filters.startDate ? 'De: ' + filters.startDate : ''} ${filters.endDate ? 'Até: ' + filters.endDate : ''} ${filters.driverId && filters.driverId !== 'all' ? 'Motorista: ' + filters.driverId : ''}`
    ],
    [""],
    ["LISTAGEM DE ROTAS"],
    [""],
    ["Data", "Motorista", "Destino", "Vendas", "Valor Total"]
  ];

  // Adicionar dados de cada rota
  reports.forEach(report => {
    routesData.push([
      new Date(report.date).toLocaleDateString('pt-BR'),
      report.driver,
      report.destination,
      report.salesCount.toString(),
      `R$ ${report.totalAmount.toFixed(2)}`
    ]);
  });

  // Dados para a planilha de resumo
  const summaryData = [
    ["RESUMO DO RELATÓRIO"],
    [""],
    ["Total de rotas:", reports.length.toString()],
    ["Total de vendas:", reports.reduce((sum, r) => sum + r.salesCount, 0).toString()],
    ["Valor total gerado:", `R$ ${reports.reduce((sum, r) => sum + r.totalAmount, 0).toFixed(2)}`],
    ["Destinos atendidos:", [...new Set(reports.map(r => r.destination))].length.toString()],
    [""],
    ["VENDAS POR TIPO DE PRODUTO"],
    [""],
    ["Gás P13:", reports.reduce((sum, r) => sum + r.details.gasP13Sold, 0).toString()],
    ["Gás P20:", reports.reduce((sum, r) => sum + r.details.gasP20Sold, 0).toString()],
    ["Gás P45:", reports.reduce((sum, r) => sum + r.details.gasP45Sold, 0).toString()],
    ["Água:", reports.reduce((sum, r) => sum + r.details.waterSold, 0).toString()],
    [""],
    ["DESEMPENHO POR MOTORISTA"],
    [""],
    ["Motorista", "Rotas", "Vendas", "Valor Total"]
  ];

  // Calcular estatísticas por motorista
  const driverStats: Record<string, { routes: number, sales: number, amount: number }> = {};
  
  reports.forEach(report => {
    if (!driverStats[report.driver]) {
      driverStats[report.driver] = { routes: 0, sales: 0, amount: 0 };
    }
    driverStats[report.driver].routes++;
    driverStats[report.driver].sales += report.salesCount;
    driverStats[report.driver].amount += report.totalAmount;
  });

  Object.entries(driverStats).forEach(([driver, stats]) => {
    summaryData.push([
      driver,
      stats.routes.toString(),
      stats.sales.toString(),
      `R$ ${stats.amount.toFixed(2)}`
    ]);
  });

  // Criar as planilhas
  const routesSheet = xlsx.utils.aoa_to_sheet(routesData);
  const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);

  // Aplicar estilos
  const applyStyles = (sheet: xlsx.WorkSheet, dataArray: any[][]) => {
    if (!sheet['!ref']) return;
    
    const range = xlsx.utils.decode_range(sheet['!ref']);
    
    for (let r = 0; r <= range.e.r; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cellAddress = xlsx.utils.encode_cell({ r, c });
        if (!sheet[cellAddress]) continue;
        
        // Título principal
        if (r === 0 && c === 0) {
          sheet[cellAddress].s = excelStyles.titleStyle;
        }
        // Cabeçalhos de seção
        else if ((dataArray[r] && dataArray[r][0] === "LISTAGEM DE ROTAS") || 
                 (dataArray[r] && dataArray[r][0] === "RESUMO DO RELATÓRIO") ||
                 (dataArray[r] && dataArray[r][0] === "VENDAS POR TIPO DE PRODUTO") ||
                 (dataArray[r] && dataArray[r][0] === "DESEMPENHO POR MOTORISTA")) {
          sheet[cellAddress].s = excelStyles.subHeaderStyle;
        }
        // Cabeçalhos de colunas em tabelas
        else if ((r === 7 && dataArray[0][0] === "RELATÓRIO DE ROTAS") ||
                 (r === 17 && dataArray[0][0] === "RESUMO DO RELATÓRIO")) {
          sheet[cellAddress].s = excelStyles.headerStyle;
        }
        // Células de dados
        else {
          sheet[cellAddress].s = excelStyles.dataStyle;
        }
      }
    }
  };

  applyStyles(routesSheet, routesData);
  applyStyles(summarySheet, summaryData);

  // Ajustar largura das colunas
  routesSheet['!cols'] = [
    { wch: 15 }, // Data
    { wch: 25 }, // Motorista
    { wch: 25 }, // Destino
    { wch: 10 }, // Vendas
    { wch: 15 }  // Valor
  ];

  summarySheet['!cols'] = [
    { wch: 25 }, // Título/Motorista
    { wch: 15 }, // Valor/Rotas
    { wch: 15 }, // Vendas
    { wch: 15 }  // Valor
  ];

  // Adicionar as planilhas ao workbook
  xlsx.utils.book_append_sheet(workbook, routesSheet, "Rotas");
  xlsx.utils.book_append_sheet(workbook, summarySheet, "Resumo");

  // Gerar o arquivo Excel
  const excelBuffer = xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};
