import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChequeCalculado, brl, dataBR } from "./chequeCalc";

const AZUL: [number, number, number] = [30, 64, 175];

interface Params {
  linhas: ChequeCalculado[];
  taxa: number;
  data: string;
  descricao?: string;
  totalValor: number;
  totalJuros: number;
  totalLiquido: number;
}

export function gerarPdfTrocaCheques({
  linhas,
  taxa,
  data,
  descricao,
  totalValor,
  totalJuros,
  totalLiquido,
}: Params) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(15);
  doc.text("Troca de Cheques", w / 2, 16, { align: "center" });
  doc.setFontSize(9);
  doc.text(
    `Data: ${dataBR(data)}    Taxa de juros: ${taxa.toString().replace(".", ",")}% ao mês${
      descricao ? `    Ref.: ${descricao}` : ""
    }`,
    w / 2,
    22,
    { align: "center" }
  );

  autoTable(doc, {
    startY: 28,
    head: [["Valor", "Nome", "Data Inic", "Data Fim", "Qtde Dias", "Juros", "Vlr Líq"]],
    body: linhas.map((l) => [
      brl(l.valor),
      l.nome,
      dataBR(l.dataInicio),
      dataBR(l.dataFim),
      String(l.dias),
      brl(l.juros),
      brl(l.liquido),
    ]),
    foot: [[brl(totalValor), "", "", "", "", brl(totalJuros), brl(totalLiquido)]],
    theme: "grid",
    headStyles: { fillColor: AZUL, halign: "center" },
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 10, minCellHeight: 8 },
    columnStyles: {
      0: { halign: "right" },
      4: { halign: "center" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  const y = (doc as any).lastAutoTable.finalY + 20;
  doc.setLineWidth(0.3);
  doc.line(20, y, 90, y);
  doc.line(w - 90, y, w - 20, y);
  doc.setFontSize(8);
  doc.text("Responsável", 55, y + 4.5, { align: "center" });
  doc.text("Cliente", w - 55, y + 4.5, { align: "center" });

  doc.save(`troca-cheques-${data}.pdf`);
}
