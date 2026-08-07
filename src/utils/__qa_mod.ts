import fs from "fs";
let n=1;
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AZUL: [number, number, number] = [30, 64, 175];

interface CabecalhoOpts {
  titulo: string;
  subtitulo: string;
  campos: string[];
}

function cabecalho(doc: jsPDF, { titulo, subtitulo, campos }: CabecalhoOpts) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFontSize(15);
  doc.text(titulo, w / 2, 14, { align: "center" });
  doc.setFontSize(9);
  doc.text(subtitulo, w / 2, 19.5, { align: "center" });

  let y = 28;
  const col = (w - 28) / 2;
  campos.forEach((campo, i) => {
    const x = 14 + (i % 2) * col;
    doc.setFontSize(9);
    doc.text(`${campo}:`, x, y);
    const labelW = doc.getTextWidth(`${campo}:`) + 2;
    doc.setLineWidth(0.2);
    doc.line(x + labelW, y + 1, x + col - 6, y + 1);
    if (i % 2 === 1) y += 8;
  });
  if (campos.length % 2 === 1) y += 8;
  return y;
}

function rodape(doc: jsPDF, y: number, esquerda: string, direita: string) {
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const yy = Math.min(y + 18, pageH - 18);
  doc.setLineWidth(0.3);
  doc.line(20, yy, 90, yy);
  doc.line(w - 90, yy, w - 20, yy);
  doc.setFontSize(8);
  doc.text(esquerda, 55, yy + 4.5, { align: "center" });
  doc.text(direita, w - 55, yy + 4.5, { align: "center" });
  doc.setFontSize(7);
  doc.text(
    "Após o retorno, lance estas informações no sistema (Portaria → Nova Venda / Pedidos).",
    w / 2,
    pageH - 8,
    { align: "center" }
  );
}

function linhasVazias(colunas: number, quantidade: number) {
  return Array.from({ length: quantidade }, () => Array(colunas).fill(""));
}

const hoje = () => new Date().toLocaleDateString("pt-BR");

/** Folha de rota para o entregador anotar as vendas na rua (sem internet). */
export function gerarFolhaRota(linhas = 18) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const y = cabecalho(doc, {
    titulo: "Folha de Rota - Vendas na Rua",
    subtitulo: `Preencha à mão durante a rota. Data de impressão: ${hoje()}`,
    campos: ["Data", "Entregador", "Veículo / Placa", "Saída (hora)", "Cheios levados (P13/P20/P45/Água)", "Retorno (hora)"],
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Cliente / Endereço", "Telefone", "P13", "P20", "P45", "Água", "Vasilhame devolvido", "Forma de pagamento", "Valor R$", "Obs."]],
    body: linhasVazias(11, linhas),
    theme: "grid",
    headStyles: { fillColor: AZUL, fontSize: 8 },
    styles: { fontSize: 8, minCellHeight: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 62 },
      2: { cellWidth: 24 },
      3: { cellWidth: 12 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 },
      7: { cellWidth: 24 },
      8: { cellWidth: 34 },
      9: { cellWidth: 20 },
    },
  });

  let yy = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: yy,
    head: [["Despesas na rota (combustível, alimentação, etc.)", "Valor R$"]],
    body: linhasVazias(2, 3),
    theme: "grid",
    headStyles: { fillColor: AZUL, fontSize: 8 },
    styles: { fontSize: 8, minCellHeight: 8 },
    columnStyles: { 1: { cellWidth: 30 } },
    tableWidth: 150,
  });

  yy = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(9);
  doc.text("Total recebido em dinheiro: R$ ______________     Total em PIX/cartão: R$ ______________", 14, yy);

  rodape(doc, yy, "Entregador", "Conferido pela portaria");
  fs.writeFileSync("/tmp/qa/out-"+String(n++)+".pdf", Buffer.from(doc.output("arraybuffer")));
}

/** Folha de vendas da portaria para dias sem sistema/internet/energia. */
export function gerarFolhaVendasPortaria(linhas = 22) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const y = cabecalho(doc, {
    titulo: "Vendas da Portaria - Registro Manual",
    subtitulo: `Use quando o sistema estiver indisponível ou o operador ainda não usar o app. Data de impressão: ${hoje()}`,
    campos: ["Data", "Operador (quem está na portaria)", "Turno", "Estoque inicial de cheios"],
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Hora", "Cliente (nome)", "Telefone", "Tipo de venda (completa / recarga / só vasilhame)", "P13", "P20", "P45", "Água", "Forma de pagamento", "Valor R$"]],
    body: linhasVazias(11, linhas),
    theme: "grid",
    headStyles: { fillColor: AZUL, fontSize: 8 },
    styles: { fontSize: 8, minCellHeight: 7.5 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 14 },
      2: { cellWidth: 48 },
      3: { cellWidth: 24 },
      4: { cellWidth: 52 },
      5: { cellWidth: 11 },
      6: { cellWidth: 11 },
      7: { cellWidth: 11 },
      8: { cellWidth: 11 },
      9: { cellWidth: 34 },
    },
  });

  const yy = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(8);
  doc.text(
    "Formas de pagamento: Dinheiro | PIX | Cartão débito | Cartão crédito | Nota promissória (anotar o nome do cliente) | Vale-Gás | Convênio | Gás-Povo",
    14,
    yy
  );

  rodape(doc, yy, "Operador da portaria", "Lançado no sistema por");
  fs.writeFileSync("/tmp/qa/out-"+String(n++)+".pdf", Buffer.from(doc.output("arraybuffer")));
}

/** Folha de fechamento de caixa em branco (dia manual). */
export function gerarFolhaFechamentoManual() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const y = cabecalho(doc, {
    titulo: "Fechamento de Caixa - Manual",
    subtitulo: `Preencha ao final do dia e coloque junto ao envelope. Data de impressão: ${hoje()}`,
    campos: ["Data", "Operador", "Abertura (hora)", "Fechamento (hora)"],
  });

  autoTable(doc, {
    startY: y,
    head: [["Forma de pagamento", "Qtd. de vendas", "Valor R$"]],
    body: ["Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito", "Nota promissória", "Vale-Gás", "Convênio / Gás-Povo"].map((f) => [f, "", ""]),
    foot: [["TOTAL", "", ""]],
    theme: "grid",
    headStyles: { fillColor: AZUL },
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9, minCellHeight: 9 },
  });

  let yy = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: yy,
    head: [["Produto", "Cheios no início", "Recebidos do pátio", "Vendidos", "Cheios no fim", "Vazios no fim"]],
    body: ["P13", "P20", "P45", "Água"].map((p) => [p, "", "", "", "", ""]),
    theme: "grid",
    headStyles: { fillColor: AZUL },
    styles: { fontSize: 9, minCellHeight: 9 },
  });

  yy = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: yy,
    head: [["Despesas / sangrias do dia", "Quem recebeu", "Valor R$"]],
    body: linhasVazias(3, 4),
    theme: "grid",
    headStyles: { fillColor: AZUL },
    styles: { fontSize: 9, minCellHeight: 9 },
  });

  yy = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text("Dinheiro no envelope: R$ ______________", 14, yy);
  yy += 7;
  doc.text("Observações: ______________________________________________________________", 14, yy);

  rodape(doc, yy, "Conferido por (portaria)", "Recebido por (administração)");
  fs.writeFileSync("/tmp/qa/out-"+String(n++)+".pdf", Buffer.from(doc.output("arraybuffer")));
}
