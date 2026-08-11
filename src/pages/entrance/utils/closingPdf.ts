import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CashierData } from "../types/cashierTypes";
import { formatCurrency } from "@/lib/formatUtils";

export interface PdfCategoriaPagamento {
  label: string;
  quantidade: number;
  valor: number;
  produtos: { p13: number; p20: number; p45: number; water: number };
}

export interface PdfDespesa {
  descricao: string;
  categoria?: string | null;
  origem?: string | null;
  valor: number;
}

export interface PdfMovimentoProduto {
  produto: string;
  aberturaCheios: number;
  aberturaVazios: number;
  patioRecebidoCheios: number;
  patioEnviadoCheios: number;
  patioVazios: number;
  devolucoesVazios: number;
  vendas: number;
}

export interface ClosingPdfInput {
  tipo: "partial" | "total";
  cashierData: CashierData;
  operador?: string;
  observacoes?: string;
  motivoAlteracao?: string;
  dataFechamento?: string;
  estoque: {
    produto: string;
    sistemaCheios: number;
    contadoCheios: number;
    sistemaVazios: number;
    contadoVazios: number;
    vendas: number;
  }[];
  /** Todas as formas de pagamento (exceto agregados, que vão consolidados) */
  categorias?: PdfCategoriaPagamento[];
  /** Total consolidado dos agregados (revendedores) */
  agregados?: { quantidade: number; valor: number; produtos: { p13: number; p20: number; p45: number; water: number } };
  despesas?: PdfDespesa[];
  movimento?: PdfMovimentoProduto[];
}

const AZUL: [number, number, number] = [30, 64, 175];

const dataHora = (dataFechamento?: string) => {
  if (dataFechamento) {
    return new Date(dataFechamento + "T00:00:00").toLocaleDateString("pt-BR", {
      dateStyle: "long",
    });
  }
  return new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const finalY = (doc: jsPDF) => (doc as any).lastAutoTable.finalY as number;

export function gerarPdfFechamento(input: ClosingPdfInput) {
  const {
    tipo,
    cashierData,
    estoque,
    observacoes,
    operador,
    dataFechamento,
    motivoAlteracao,
    categorias,
    agregados,
    despesas,
    movimento,
  } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text("Fechamento de Caixa - Portaria", pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.text(
    `${tipo === "total" ? "Fechamento total" : "Fechamento parcial"}  |  ${dataHora(dataFechamento)}`,
    pageWidth / 2,
    22,
    { align: "center" }
  );
  if (operador) {
    doc.text(`Operador: ${operador}`, pageWidth / 2, 27, { align: "center" });
  }

  // 1) Formas de pagamento — valor + quantidade por produto
  const linhasPagamento: (string | number)[][] = [];
  let somaQtd = 0;
  let somaValor = 0;

  if (categorias && categorias.length > 0) {
    categorias.forEach((c) => {
      somaQtd += c.quantidade;
      somaValor += c.valor;
      linhasPagamento.push([
        c.label,
        c.produtos.p13 || "-",
        c.produtos.p20 || "-",
        c.produtos.p45 || "-",
        c.produtos.water || "-",
        c.quantidade,
        formatCurrency(c.valor),
      ]);
    });
    if (agregados && agregados.quantidade > 0) {
      somaQtd += agregados.quantidade;
      somaValor += agregados.valor;
      linhasPagamento.push([
        "Agregados (total)",
        agregados.produtos.p13 || "-",
        agregados.produtos.p20 || "-",
        agregados.produtos.p45 || "-",
        agregados.produtos.water || "-",
        agregados.quantidade,
        formatCurrency(agregados.valor),
      ]);
    }
  } else {
    const pagamentos: [string, number][] = [
      ["Dinheiro", cashierData.cash],
      ["Cartão de crédito", cashierData.credit],
      ["Cartão de débito", cashierData.debit],
      ["PIX", cashierData.pix],
      ["Nota promissória", cashierData.promissory],
      ["Vale gás", cashierData.gasVoucher],
    ];
    pagamentos.forEach(([label, v]) => {
      somaValor += v;
      linhasPagamento.push([label, "-", "-", "-", "-", "-", formatCurrency(v)]);
    });
  }

  const yTitulo1 = operador ? 34 : 29;
  doc.setFontSize(11);
  doc.setTextColor(AZUL[0], AZUL[1], AZUL[2]);
  doc.text("1. Vendas por forma de pagamento (quantidade e valor)", 14, yTitulo1);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: yTitulo1 + 2.5,

    head: [["Forma de pagamento", "P13", "P20", "P45", "Água", "Qtd.", "Valor R$"]],
    body: linhasPagamento,
    foot: [["TOTAL", "", "", "", "", somaQtd || "-", formatCurrency(somaValor || cashierData.totalSales)]],
    theme: "grid",
    headStyles: { fillColor: AZUL },
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "right" },
    },
  });

  const titulo = (texto: string) => {
    const yT = finalY(doc) + 8;
    doc.setFontSize(11);
    doc.setTextColor(AZUL[0], AZUL[1], AZUL[2]);
    doc.text(texto, 14, yT);
    doc.setTextColor(0, 0, 0);
    return yT + 2.5;
  };

  // 2) Movimentação do dia (abertura, pátio, vazios)
  if (movimento && movimento.length > 0) {
    autoTable(doc, {
      startY: titulo("2. Movimentação do dia (início, pátio e vasilhames)"),
      head: [
        [
          "Produto",
          "Cheios início do dia",
          "Desceu do pátio",
          "Voltou ao pátio",
          "Vendidos",
          "Vazios início",
          "Vazios do pátio",
          "Vazios devolvidos",
        ],
      ],
      body: movimento.map((m) => [
        m.produto,
        m.aberturaCheios,
        m.patioRecebidoCheios,
        m.patioEnviadoCheios,
        m.vendas,
        m.aberturaVazios,
        m.patioVazios,
        m.devolucoesVazios,
      ]),
      theme: "grid",
      headStyles: { fillColor: AZUL, fontSize: 7.5 },
      styles: { fontSize: 8, halign: "center" },
      columnStyles: { 0: { halign: "left", cellWidth: 26 } },
    });
  }

  // 3) Contagem física x sistema
  autoTable(doc, {
    startY: titulo("3. Contagem física do estoque x sistema"),
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
        div === 0 ? "OK" : div > 0 ? `+${div}` : String(div),
      ];
    }),
    theme: "grid",
    headStyles: { fillColor: AZUL },
    styles: { fontSize: 9 },
  });

  // 4) Despesas do dia
  const totalDespesas = (despesas || []).reduce((a, d) => a + d.valor, 0);
  autoTable(doc, {
    startY: titulo("4. Despesas do dia"),
    head: [["Descrição", "Categoria", "Origem do dinheiro", "Valor R$"]],

    body:
      despesas && despesas.length > 0
        ? despesas.map((d) => [d.descricao, d.categoria || "-", d.origem || "-", formatCurrency(d.valor)])
        : [["Nenhuma despesa lançada nesta data", "-", "-", formatCurrency(0)]],
    foot: [["TOTAL DE DESPESAS", "", "", formatCurrency(totalDespesas)]],
    theme: "grid",
    headStyles: { fillColor: AZUL },
    footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9 },
    columnStyles: { 3: { halign: "right", cellWidth: 28 } },
  });

  let y = finalY(doc) + 10;
  const pageH = doc.internal.pageSize.getHeight();
  const quebra = (necessario: number) => {
    if (y + necessario > pageH - 20) {
      doc.addPage();
      y = 20;
    }
  };

  if (motivoAlteracao?.trim()) {
    quebra(20);
    doc.setFontSize(10);
    doc.text("Motivo da alteração após o fechamento:", 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(motivoAlteracao, pageWidth - 28), 14, y);
    y += 12;
  }

  if (observacoes?.trim()) {
    quebra(20);
    doc.setFontSize(10);
    doc.text("Observações:", 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(observacoes, pageWidth - 28), 14, y);
    y += 12;
  }

  quebra(40);
  doc.setFontSize(11);
  doc.text(`Valor em dinheiro no envelope: R$ ${formatCurrency(cashierData.cash)}`, 14, y + 6);
  if (totalDespesas > 0) {
    doc.setFontSize(9);
    doc.text(
      `(Total de despesas do dia: R$ ${formatCurrency(totalDespesas)})`,
      14,
      y + 12
    );
  }

  y += 32;
  quebra(20);
  doc.setLineWidth(0.3);
  doc.line(20, y, 90, y);
  doc.line(pageWidth - 90, y, pageWidth - 20, y);
  doc.setFontSize(9);
  doc.text("Conferido por (portaria)", 55, y + 5, { align: "center" });
  doc.text("Recebido por (administração)", pageWidth - 55, y + 5, { align: "center" });

  const nome = `fechamento-portaria-${(dataFechamento || new Date().toISOString().slice(0, 10))}.pdf`;
  doc.save(nome);
}
