import { PromissoryNote } from "../types";
import * as xlsx from 'xlsx';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Estilos para o Excel semelhantes aos utilizados nos relatórios do dashboard
const excelStyles = {
  headerStyle: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "22C55E" } }, // Verde GasFlow (gasflow-500)
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "15803D" } }, // gasflow-700
      bottom: { style: "thin", color: { rgb: "15803D" } },
      left: { style: "thin", color: { rgb: "15803D" } },
      right: { style: "thin", color: { rgb: "15803D" } }
    }
  },
  
  titleStyle: {
    font: { bold: true, size: 14, color: { rgb: "166534" } }, // gasflow-800
    fill: { fgColor: { rgb: "F0FDF4" } }, // gasflow-50
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "15803D" } }, // gasflow-700
      bottom: { style: "medium", color: { rgb: "15803D" } },
      left: { style: "medium", color: { rgb: "15803D" } },
      right: { style: "medium", color: { rgb: "15803D" } }
    }
  },

  dataStyle: {
    font: { color: { rgb: "333333" } },
    border: {
      top: { style: "thin", color: { rgb: "BBBBBB" } },
      bottom: { style: "thin", color: { rgb: "BBBBBB" } },
      left: { style: "thin", color: { rgb: "BBBBBB" } },
      right: { style: "thin", color: { rgb: "BBBBBB" } }
    },
    alignment: { horizontal: "right", vertical: "center" }
  },
  
  dateStyle: {
    font: { color: { rgb: "333333" } },
    border: {
      top: { style: "thin", color: { rgb: "BBBBBB" } },
      bottom: { style: "thin", color: { rgb: "BBBBBB" } },
      left: { style: "thin", color: { rgb: "BBBBBB" } },
      right: { style: "thin", color: { rgb: "BBBBBB" } }
    },
    alignment: { horizontal: "center", vertical: "center" }
  }
};

export const generatePromissoryReport = async (
  notes: PromissoryNote[], 
  statusFilter?: string
): Promise<Blob> => {
  const workbook = xlsx.utils.book_new();
  const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  
  // Dados para planilha principal
  const notesData = [
    ["RELATÓRIO DE NOTAS PROMISSÓRIAS - GASFLOW AQUA"],
    [""],
    ["Data de Emissão:", currentDate],
    ["Total de Notas:", notes.length.toString()],
    ["Status:", statusFilter || "Todas"],
    [""],
    // Cabeçalhos da tabela
    ["ID", "Cliente", "Valor (R$)", "Data Vencimento", "Status", "Cobrador", "Data de Pagamento"]
  ];
  
  // Adicionar cada nota promissória à planilha
  notes.forEach(note => {
    const paymentInfo = note.paidAt 
      ? format(note.paidAt, "dd/MM/yyyy")
      : "Sem pagamento";
      
    const status = {
      'pending': 'Pendente',
      'assigned': 'Atribuída',
      'paid': 'Paga',
      'overdue': 'Vencida'
    }[note.status] || note.status;
    
    notesData.push([
      note.id,
      note.clientName,
      note.value.toFixed(2),
      format(note.dueDate, "dd/MM/yyyy"),
      status,
      note.assignedTo || "Não atribuído",
      paymentInfo
    ]);
  });
  
  // Resumo por status
  const statusSummary = [
    [""],
    ["RESUMO POR STATUS"],
    [""],
    ["Status", "Quantidade", "Valor Total (R$)"]
  ];
  
  const statusCounts = {
    pending: { count: 0, value: 0 },
    assigned: { count: 0, value: 0 },
    paid: { count: 0, value: 0 },
    overdue: { count: 0, value: 0 }
  };
  
  notes.forEach(note => {
    if (statusCounts[note.status]) {
      statusCounts[note.status].count += 1;
      statusCounts[note.status].value += note.value;
    }
  });
  
  statusSummary.push(
    ["Pendente", statusCounts.pending.count.toString(), statusCounts.pending.value.toFixed(2)],
    ["Atribuída", statusCounts.assigned.count.toString(), statusCounts.assigned.value.toFixed(2)],
    ["Paga", statusCounts.paid.count.toString(), statusCounts.paid.value.toFixed(2)],
    ["Vencida", statusCounts.overdue.count.toString(), statusCounts.overdue.value.toFixed(2)],
    [""],
    ["Total", notes.length.toString(), notes.reduce((sum, note) => sum + note.value, 0).toFixed(2)]
  );
  
  // Criar e adicionar a planilha ao workbook com estilos
  const addSheetWithStyles = (data: any[][], name: string) => {
    const ws = xlsx.utils.aoa_to_sheet(data);
    
    // Configurar larguras das colunas
    const colWidths = [
      { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, 
      { wch: 15 }, { wch: 20 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;
    
    // Mesclar células para o título principal
    if (data[0] && data[0][0]) {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
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
        // Cabeçalhos
        else if (row === 6 || (name === "Resumo" && row === 3)) {
          ws[cellRef].s = excelStyles.headerStyle;
        }
        // Células de dados
        else if (row > 6 || (name === "Resumo" && row > 3)) {
          ws[cellRef].s = excelStyles.dataStyle;
        }
      }
    }

    xlsx.utils.book_append_sheet(workbook, ws, name);
  };

  addSheetWithStyles(notesData, "Notas Promissórias");
  addSheetWithStyles(statusSummary, "Resumo");

  // Gerar arquivo Excel
  const excelBuffer = xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};
