import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CashierData } from "../types/cashierTypes";
import { formatCurrency } from "@/lib/formatUtils";

export interface ClosingPdfInput {
  tipo: "partial" | "total";
  cashierData: CashierData;
  operador?: string;
  observacoes?: string;
  estoque: {
    produto: string;
    sistemaCheios: number;
    contadoCheios: number;
    sistemaVazios: number;
    contadoVazios: number;
    vendas: number;
  }[];
}

const dataHora = () =>
  new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function gerarPdfFechamento(input: ClosingPdfInput) {
  const { tipo, cashierData, estoque, observacoes, operador } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text("Fechamento de Caixa - Portaria", pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.text(
    `${tipo === "total" ? "Fechamento total do dia" : "Fechamento parcial"}  |  ${dataHora()}`,
    pageWidth / 2,
    22,
    { align: "center" }
  );
  if (operador) {
    doc.text(`Operador: ${operador}`, pageWidth / 2, 27, { align: "center" });
  }

  const pagamentos: [string, number][] = [
    ["Dinheiro", cashierData.cash],
    ["Cartão de crédito", cashierData.credit],
    ["Cartão de débito", cashierData.debit],
    ["PIX", cashierData.pix],
    ["Nota promissória", cashierData.promissory],
    ["Vale gás", cashierData.gasVoucher],
  ];

  autoTable(doc, {
    startY: operador ? 33 : 28,
    head: [["Forma de pagamento", "Valor"]],
    body: pagamentos.map(([label, v]) => [label, formatCurrency(v)]),
    foot: [["TOTAL DE VENDAS", formatCurrency(cashierData.totalSales)]],
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175] },
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 10 },
  });

  const afterPay = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: afterPay,
    head: [["Produto", "Vendas", "Cheios (sist.)", "Cheios (contado)", "Vazios (sist.)", "Vazios (contado)", "Diverg."]],
    body: estoque.map((e) => {
      const div = e.contadoCheios - e.sistemaCheios + (e.contadoVazios - e.sistemaVazios);
      return [
        e.produto,
        String(e.vendas),
        String(e.sistemaCheios),
        String(e.contadoCheios),
        String(e.sistemaVazios),
        String(e.contadoVazios),
        div === 0 ? "OK" : (div > 0 ? `+${div}` : String(div)),
      ];
    }),
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 9 },
  });

  let y = (doc as any).lastAutoTable.finalY + 10;

  if (observacoes?.trim()) {
    doc.setFontSize(10);
    doc.text("Observações:", 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(observacoes, pageWidth - 28), 14, y);
    y += 12;
  }

  doc.setFontSize(11);
  doc.text(`Valor em dinheiro no envelope: ${formatCurrency(cashierData.cash)}`, 14, y + 6);

  y += 30;
  doc.setLineWidth(0.3);
  doc.line(20, y, 90, y);
  doc.line(pageWidth - 90, y, pageWidth - 20, y);
  doc.setFontSize(9);
  doc.text("Conferido por (portaria)", 55, y + 5, { align: "center" });
  doc.text("Recebido por (administração)", pageWidth - 55, y + 5, { align: "center" });

  const nome = `fechamento-portaria-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nome);
}
