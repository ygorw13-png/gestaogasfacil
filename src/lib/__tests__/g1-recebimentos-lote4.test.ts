/** Lote 4: destino do dinheiro e quadros do painel (mesma regra de _destino_efetivo, SQL 008). */
import { describe, it, expect } from "vitest";
import { destinoEfetivo, summarizePainel } from "../orderMetrics";

const R = (o: Record<string, unknown>) => ({ valor: 0, origem: "venda", criado_em: "x", acerto_id: null, ...o }) as never;

describe("destino do recebimento", () => {
  it("destino gravado prevalece", () => {
    expect(destinoEfetivo({ destino: "cobrador", forma: "dinheiro", origem: "promissoria" })).toBe("cobrador");
  });
  it("linhas antigas: PIX/cartão = não informado; dinheiro de entrega/rua = entregador; demais = caixa", () => {
    expect(destinoEfetivo({ forma: "pix", origem: "entrega" })).toBe("nao_informado");
    expect(destinoEfetivo({ forma: "cartao", origem: "venda" })).toBe("nao_informado");
    expect(destinoEfetivo({ forma: "dinheiro", origem: "venda_rua" })).toBe("entregador");
    expect(destinoEfetivo({ forma: "dinheiro", origem: "venda" })).toBe("caixa");
    expect(destinoEfetivo({ forma: "dinheiro", origem: "promissoria" })).toBe("caixa");
  });
});

describe("painel: recebido do dia separado por onde está o valor", () => {
  const base = { ordersHoje: [], notas: [], divergenciasHoje: [], hoje: "2026-11-10" };
  it("PIX não é contado como dinheiro com o entregador nem como caixa", () => {
    const p = summarizePainel({ ...base, recebimentosHoje: [R({ valor: 120, origem: "venda_rua", forma: "pix", destino: "nao_informado" })] });
    expect(p.recebido).toEqual({ total: 120, noCaixa: 0, aguardandoAcerto: 0, pixCartao: 120, deTitulos: 0 });
  });
  it("dinheiro acertado sai de 'aguardando' e entra no caixa", () => {
    const p = summarizePainel({ ...base, recebimentosHoje: [
      R({ valor: 125, origem: "venda_rua", forma: "dinheiro", destino: "entregador", acerto_id: "a1" }),
      R({ valor: 130, origem: "entrega", forma: "dinheiro", destino: "entregador" }),
    ] });
    expect(p.recebido).toEqual({ total: 255, noCaixa: 125, aguardandoAcerto: 130, pixCartao: 0, deTitulos: 0 });
  });
  it("título cobrado na rua fica com o cobrador (aguardando), e conta em 'de títulos'", () => {
    const p = summarizePainel({ ...base, recebimentosHoje: [R({ valor: 50, origem: "promissoria", forma: "dinheiro", destino: "cobrador" })] });
    expect(p.recebido).toEqual({ total: 50, noCaixa: 0, aguardandoAcerto: 50, pixCartao: 0, deTitulos: 50 });
  });
  it("saldo a receber usa o saldo restante (parcial) e vencida só depois do dia do vencimento", () => {
    const p = summarizePainel({ ...base, recebimentosHoje: [], notas: [
      { value: 100, paid_amount: 40, status: "parcial", due_date: "2026-11-09" },
      { value: 80, paid_amount: 0, status: "pending", due_date: "2026-11-10" },
      { value: 50, paid_amount: 50, status: "paid", due_date: "2026-11-01" },
    ] as never });
    expect(p.aReceber).toBe(140);
    expect(p.vencido).toEqual({ count: 1, value: 60 });
  });
});
