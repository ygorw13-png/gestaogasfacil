import { describe, expect, it } from "vitest";
import { pendenciasFisicas, resumoReversoes, tiposPermitidos, exigeReferencia } from "@/lib/g1/reversao";

const base = {
  esperado_cheios: 0, confirmado_cheios: 0, esperado_vazios_recolher: 0, confirmado_vazios_recolher: 0,
  esperado_vazios_cliente: 0, confirmado_vazios_cliente: 0, esperado_substituto: 0, confirmado_substituto: 0,
};

describe("decisão B — reversão controlada (telas)", () => {
  it("devolução de recarga: só o cheio voltou, o vazio do cliente continua pendente", () => {
    const p = pendenciasFisicas({ ...base, esperado_cheios: 1, confirmado_cheios: 1, esperado_vazios_cliente: 1 });
    expect(p.pendente).toBe(true);
    expect(p.cheios).toBe(0);
    expect(p.vaziosCliente).toBe(1);
  });

  it("promissória R$125 com R$40 pagos: R$40 ficam a reembolsar, nada aparece como reembolsado", () => {
    const r = resumoReversoes([{ tipo: "devolucao", status: "reembolso_pendente", valor_venda: 125 }], [{ status: "pendente", valor: 40 }]);
    expect(r.reembolsoPendente).toBe(40);
    expect(r.reembolsado).toBe(0);
    expect(r.valorVendasRevertidas).toBe(125);
  });

  it("solicitação ainda não autorizada e recusada não contam como venda revertida", () => {
    const r = resumoReversoes([
      { tipo: "devolucao", status: "solicitada", valor_venda: 100 },
      { tipo: "devolucao", status: "recusada", valor_venda: 90 },
    ], []);
    expect(r.vendasRevertidas).toBe(0);
    expect(r.aguardandoAutorizacao).toBe(1);
  });

  it("troca por problema não reverte receita", () => {
    const r = resumoReversoes([{ tipo: "troca", status: "concluida", valor_venda: 125 }], []);
    expect(r.valorVendasRevertidas).toBe(0);
  });

  it("venda concluída: devolução, troca e duplicidade; pedido em aberto: só cancelamento; devolução parcial nunca", () => {
    expect(tiposPermitidos("delivered", "recarga")).toEqual(["devolucao", "troca", "duplicidade"]);
    expect(tiposPermitidos("pending")).toEqual(["cancelamento"]);
    expect(tiposPermitidos("cancelled")).toEqual([]);
    expect(tiposPermitidos("delivered", "vasilhame")).not.toContain("troca");
  });

  it("PIX e cartão só contam como devolvidos com referência; dinheiro não exige", () => {
    expect(exigeReferencia("pix")).toBe(true);
    expect(exigeReferencia("cartao")).toBe(true);
    expect(exigeReferencia("dinheiro")).toBe(false);
  });
});
