import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FinanceiroAgregado, RetiradaAgregado } from "../hooks/useAgregadoConta";
import { brl, NOME_FORMA, NOME_TIPO } from "../hooks/useAgregadoConta";

const dt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const dia = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString("pt-BR");

/** Extrato administrativo (só administrador): retiradas, acertos e pagamentos discriminados. Não é documento fiscal. */
export function gerarExtratoAgregadoPdf(nome: string, retiradas: RetiradaAgregado[], fin: FinanceiroAgregado) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Extrato administrativo — ${nome}`, 14, 16);
  doc.setFontSize(9);
  doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}. Documento interno de conferência, não é documento fiscal.`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Retirada", "Produto", "Retirado", "Devolvido", "Acertado", "Não acertado"]],
    body: retiradas.map((r) => [dt(r.criado_em), r.produto, r.quantidade, r.devolvida, r.acertada, r.pendente]),
    styles: { fontSize: 8 },
  });
  autoTable(doc, {
    head: [["Acerto", "Valor combinado", "Ajustes", "Crédito usado", "Dinheiro recebido", "Saldo devedor", "Botijões"]],
    body: fin.acertos.map((a) => [dia(a.data), brl(a.valor), brl(a.ajustes), brl(a.credito_usado), brl(a.recebido), brl(Math.max(a.saldo, 0)),
      (a.itens ?? []).reduce((s, i) => s + i.quantidade, 0)]),
    styles: { fontSize: 8 },
  });
  autoTable(doc, {
    head: [["Data", "Lançamento", "Forma", "Valor", "Observação"]],
    body: fin.lancamentos.map((l) => [dt(l.recebido_em), NOME_TIPO[l.tipo] ?? l.tipo, l.forma ? NOME_FORMA[l.forma] ?? l.forma : "—",
      brl(l.valor), [l.observacoes, l.anulado_em ? `ANULADO: ${l.anulado_motivo ?? ""}` : ""].filter(Boolean).join(" · ")]),
    styles: { fontSize: 8 },
  });
  const credito = fin.creditos.filter((c) => !c.anulado).reduce((s, c) => s + c.saldo, 0);
  const devido = fin.acertos.reduce((s, a) => s + Math.max(a.saldo, 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const y = ((doc as any).lastAutoTable?.finalY ?? 40) + 8;
  doc.setFontSize(10);
  doc.text(`Saldo devedor em acertos: ${brl(devido)}    Crédito disponível (por conta): ${brl(credito)}`, 14, y);
  doc.save(`extrato-agregado-${nome.replace(/[^\w]+/g, "-").toLowerCase()}.pdf`);
}
