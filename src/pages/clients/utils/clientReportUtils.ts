
import * as xlsx from 'xlsx';
import { Client } from "../hooks/useClients";

// Função para gerar um relatório de clientes em Excel
export const generateClientReport = async (clients: Client[]): Promise<Blob> => {
  // Carregar a biblioteca xlsx de forma assíncrona se necessário
  const workbook = xlsx.utils.book_new();

  // Dados para a planilha principal de clientes
  const clientsData = [
    ["RELATÓRIO DE CLIENTES"],
    [""],
    ["Data de geração:", new Date().toLocaleDateString('pt-BR')],
    [""],
    ["LISTAGEM DE CLIENTES"],
    [""],
    ["Nome", "Telefone", "Endereço", "Vasilhames", "Tipos", "Data do Comodato"]
  ];

  // Adicionar dados de cada cliente
  clients.forEach(client => {
    clientsData.push([
      client.name,
      client.phone || "Não informado",
      client.address || "Não informado",
      client.cylinderCount.toString() || "0",
      client.cylinderTypes.join(", ") || "Nenhum",
      client.loanDate ? new Date(client.loanDate).toLocaleDateString('pt-BR') : "Não aplicável"
    ]);
  });

  // Planilha de resumo
  const summaryData = [
    ["RESUMO DO RELATÓRIO"],
    [""],
    ["Total de clientes:", clients.length.toString()],
    ["Total de vasilhames emprestados:", clients.reduce((total, client) => total + client.cylinderCount, 0).toString()],
    ["Clientes com vasilhames:", clients.filter(client => client.cylinderCount > 0).length.toString()],
    [""],
    ["DISTRIBUIÇÃO POR TIPO DE VASILHAME"],
    [""],
  ];

  // Calcular a distribuição de tipos de vasilhames
  const cylinderTypesCount: Record<string, number> = {};
  clients.forEach(client => {
    client.cylinderTypes.forEach(type => {
      if (!cylinderTypesCount[type]) cylinderTypesCount[type] = 0;
      cylinderTypesCount[type]++;
    });
  });

  // Adicionar distribuição ao resumo
  summaryData.push(["Tipo", "Quantidade"]);
  Object.entries(cylinderTypesCount).forEach(([type, count]) => {
    summaryData.push([type, count.toString()]);
  });

  // Criar as planilhas
  const clientsSheet = xlsx.utils.aoa_to_sheet(clientsData);
  const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);

  // Configurar estilos e formatação
  const titleStyle = {
    font: { bold: true, size: 14, color: { rgb: "166534" } }, // verde escuro
    fill: { fgColor: { rgb: "F0FDF4" } }, // verde claro
    alignment: { horizontal: "center" }
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "22C55E" } }, // verde médio
    alignment: { horizontal: "center" }
  };

  // Aplicar estilos ao título e cabeçalhos
  const applyStyles = (sheet: xlsx.WorkSheet) => {
    if (!sheet['!ref']) return;
    
    const range = xlsx.utils.decode_range(sheet['!ref']);
    
    // Estilo para o título
    const titleCell = xlsx.utils.encode_cell({ r: 0, c: 0 });
    sheet[titleCell].s = titleStyle;
    
    // Estilo para cabeçalhos de colunas
    for (let i = 0; i <= range.e.c; i++) {
      const cellAddress = xlsx.utils.encode_cell({ r: 6, c: i });
      if (sheet[cellAddress]) {
        sheet[cellAddress].s = headerStyle;
      }
    }
  };

  applyStyles(clientsSheet);
  applyStyles(summarySheet);

  // Ajustar largura das colunas
  clientsSheet['!cols'] = [
    { wch: 30 }, // Nome
    { wch: 15 }, // Telefone
    { wch: 30 }, // Endereço
    { wch: 12 }, // Vasilhames
    { wch: 20 }, // Tipos
    { wch: 18 }  // Data
  ];

  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];

  // Adicionar as planilhas ao workbook
  xlsx.utils.book_append_sheet(workbook, clientsSheet, "Clientes");
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
