interface ProdutoTotais {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export interface SalesReportData {
  periodo: string;
  vendedor: string;
  qtdVendas: number;
  totalVendido: number;
  totalCancelado: number;
  totalLiquido: number;
  produtos: ProdutoTotais;
  pagamentos: { nome: string; qtd: number; total: number }[];
  matriz: {
    produto: string;
    celulas: { pagamento: string; qtd: number; total: number }[];
    qtd: number;
    total: number;
  }[];
  conferencia: { produto: string; vendido: number; retirado: number; diferenca: number }[];
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Abre uma janela de impressão com o relatório do período (permite salvar em PDF). */
export function printSalesReport(data: SalesReportData) {
  const win = window.open("", "_blank", "width=900,height=650");
  if (!win) return;

  const pagamentosRows = data.pagamentos
    .map(
      (p) =>
        `<tr><td>${p.nome}</td><td class="c">${p.qtd}</td><td class="r">${brl(p.total)}</td></tr>`,
    )
    .join("");

  const pagList = data.pagamentos.map((p) => p.nome);
  const matrizHead = pagList.map((p) => `<th class="c">${p}</th>`).join("");
  const matrizRows = data.matriz
    .map((row) => {
      const cells = pagList
        .map((p) => {
          const c = row.celulas.find((x) => x.pagamento === p);
          return `<td class="c">${c ? `${c.qtd} un.<br/><small>${brl(c.total)}</small>` : "—"}</td>`;
        })
        .join("");
      return `<tr><td>${row.produto}</td>${cells}<td class="r"><b>${row.qtd} un.</b><br/><small>${brl(row.total)}</small></td></tr>`;
    })
    .join("");

  const conferenciaRows = data.conferencia
    .map(
      (c) =>
        `<tr><td>${c.produto}</td><td class="c">${c.vendido}</td><td class="c">${c.retirado}</td><td class="c ${
          c.diferenca === 0 ? "ok" : "div"
        }">${c.diferenca > 0 ? "+" : ""}${c.diferenca}</td></tr>`,
    )
    .join("");

  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
  <title>Relatório de Vendas — ${data.periodo}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}
    h1{font-size:20px;margin:0 0 4px}
    h2{font-size:14px;margin:24px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
    .muted{color:#666;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
    th{background:#f5f5f5}
    .c{text-align:center}.r{text-align:right}
    .cards{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .card{border:1px solid #ddd;border-radius:6px;padding:8px 12px;min-width:110px}
    .card b{display:block;font-size:16px}
    .ok{color:#15803d}.div{color:#b91c1c;font-weight:bold}
    @media print{button{display:none}}
  </style></head><body>
  <h1>Relatório de Vendas — GásFácil</h1>
  <div class="muted">Período: ${data.periodo} · Vendedor: ${data.vendedor} · Emitido em ${new Date().toLocaleString("pt-BR")}</div>

  <div class="cards">
    <div class="card"><span class="muted">Vendas</span><b>${data.qtdVendas}</b></div>
    <div class="card"><span class="muted">Total vendido</span><b>${brl(data.totalVendido)}</b></div>
    <div class="card"><span class="muted">Cancelado</span><b>${brl(data.totalCancelado)}</b></div>
    <div class="card"><span class="muted">Total líquido</span><b>${brl(data.totalLiquido)}</b></div>
  </div>

  <h2>Totais por produto</h2>
  <table><tr><th>P13</th><th>P20</th><th>P45</th><th>Água 20L</th></tr>
  <tr class="c"><td class="c">${data.produtos.p13}</td><td class="c">${data.produtos.p20}</td><td class="c">${data.produtos.p45}</td><td class="c">${data.produtos.water}</td></tr></table>

  <h2>Recebimentos por forma de pagamento</h2>
  <table><tr><th>Forma</th><th class="c">Qtd</th><th class="r">Valor</th></tr>${pagamentosRows || '<tr><td colspan="3">Sem dados</td></tr>'}</table>

  <h2>Produto × forma de pagamento</h2>
  <table><tr><th>Produto</th>${matrizHead}<th class="r">Total</th></tr>${matrizRows || `<tr><td colspan="${pagList.length + 2}">Sem dados</td></tr>`}</table>

  <h2>Conferência com o estoque retirado na portaria</h2>
  <table><tr><th>Produto</th><th class="c">Vendido</th><th class="c">Retirado</th><th class="c">Diferença</th></tr>${conferenciaRows}</table>

  <script>window.onload=()=>window.print()<\/script>
  </body></html>`);
  win.document.close();
}
