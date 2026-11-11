/**
 * Lote 1 (vendas): tipo de venda canônico e chave de reenvio presa ao conteúdo.
 * Só módulos puros (sem rede, sem React).
 */
import { describe, it, expect } from "vitest";
import { normalizarTipoVenda, tipoVendaLabel, tipoVendaShort, vasilhameDeltas } from "../saleTypes";
import {
  ControleChave,
  ConteudoAlteradoError,
  assinaturaConteudo,
  ehIncerta,
  falhaIncerta,
  idDaChave,
} from "../g1/operacao";

describe("tipo de venda canônico", () => {
  it("'completa' é o canônico; 'completo' (legado/alternativo) é lido como 'completa'", () => {
    expect(normalizarTipoVenda("completa")).toBe("completa");
    expect(normalizarTipoVenda("completo")).toBe("completa");
    expect(normalizarTipoVenda(" COMPLETO ")).toBe("completa");
  });
  it("recarga e vasilhame passam; desconhecido e vazio viram null (sem inventar tipo)", () => {
    expect(normalizarTipoVenda("recarga")).toBe("recarga");
    expect(normalizarTipoVenda("vasilhame")).toBe("vasilhame");
    expect(normalizarTipoVenda("xyz")).toBeNull();
    expect(normalizarTipoVenda(null)).toBeNull();
    expect(normalizarTipoVenda(undefined)).toBeNull();
  });
  it("rótulos tratam o histórico 'completo' igual a 'completa'", () => {
    expect(tipoVendaLabel("completo")).toBe(tipoVendaLabel("completa"));
    expect(tipoVendaShort("completo")).toBe("Completo");
    expect(tipoVendaShort("vasilhame")).toBe("Vasilhame");
    expect(tipoVendaShort("recarga")).toBe("Troca");
  });
  it("cascos por tipo: completa e vasilhame saem; recarga entra", () => {
    expect(vasilhameDeltas("completa", 2)).toEqual({ entregues: 2, recebidos: 0 });
    expect(vasilhameDeltas("vasilhame", 3)).toEqual({ entregues: 3, recebidos: 0 });
    expect(vasilhameDeltas("recarga", 4)).toEqual({ entregues: 0, recebidos: 4 });
  });
});

describe("assinatura do conteúdo", () => {
  it("ordem das chaves, espaços nas pontas e undefined não mudam a assinatura", () => {
    expect(assinaturaConteudo({ a: 1, b: " x " })).toBe(assinaturaConteudo({ b: "x", a: 1, c: undefined }));
  });
  it("valor diferente muda a assinatura", () => {
    expect(assinaturaConteudo({ valor: 125 })).not.toBe(assinaturaConteudo({ valor: 130 }));
  });
  it("125 e 125.0 são o mesmo valor", () => {
    expect(assinaturaConteudo({ valor: 125 })).toBe(assinaturaConteudo({ valor: 125.0 }));
  });
});

describe("chave de reenvio de uma operação", () => {
  const seq = () => {
    let n = 0;
    return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  };
  const venda = { produto: "P13", quantidade: 1, valor: 125, pagamento: "money", tipoVenda: "recarga" };

  it("mesma operação tentada de novo (antes de confirmar) usa a mesma chave", () => {
    const c = new ControleChave("venda", seq());
    const k1 = c.obter(venda);
    c.falhou(true); // sem resposta
    expect(c.obter({ ...venda })).toBe(k1);
  });
  it("nova venda depois de confirmada recebe outra chave, mesmo com os mesmos dados", () => {
    const c = new ControleChave("venda", seq());
    const k1 = c.obter(venda);
    c.confirmar();
    expect(c.obter(venda)).not.toBe(k1);
  });
  it("falha definitiva (servidor recusou, nada gravado) libera a chave: dados corrigidos ganham outra", () => {
    const c = new ControleChave("venda", seq());
    const k1 = c.obter(venda);
    c.falhou(false);
    expect(c.temDuvida()).toBe(false);
    expect(c.obter({ ...venda, valor: 130 })).not.toBe(k1);
  });
  it("resposta perdida + conteúdo alterado: não reaproveita nem troca a chave em silêncio", () => {
    const c = new ControleChave("venda", seq());
    c.obter(venda);
    c.falhou(true);
    expect(c.temDuvida()).toBe(true);
    expect(() => c.obter({ ...venda, valor: 130 })).toThrow(ConteudoAlteradoError);
  });
  it("com dúvida aberta, voltar aos mesmos dados reenvia com a mesma chave", () => {
    const c = new ControleChave("venda", seq());
    const k1 = c.obter(venda);
    c.falhou(true);
    expect(() => c.obter({ ...venda, valor: 130 })).toThrow(ConteudoAlteradoError);
    expect(c.obter(venda)).toBe(k1);
  });
  it("descartar a dúvida (decisão explícita) permite registrar como nova operação", () => {
    const c = new ControleChave("venda", seq());
    const k1 = c.obter(venda);
    c.falhou(true);
    c.descartarDuvida();
    const k2 = c.obter({ ...venda, valor: 130 });
    expect(k2).not.toBe(k1);
  });
  it("a chave carrega o prefixo e um uuid utilizável como id do registro", () => {
    const c = new ControleChave("pedido", seq());
    const k = c.obter(venda);
    expect(k.startsWith("pedido:")).toBe(true);
    expect(idDaChave(k)).toBe("00000000-0000-4000-8000-000000000001");
    expect(() => idDaChave("pedido:nao-e-uuid")).toThrow();
  });
});

describe("classificação de falhas", () => {
  it("erro do banco/PostgREST (com código) é definitivo", () => {
    expect(ehIncerta({ code: "P0001", message: "Carga insuficiente" })).toBe(false);
    expect(ehIncerta({ code: "42501", message: "Sem permissão" })).toBe(false);
    expect(ehIncerta({ code: "23505", message: "duplicate key" })).toBe(false);
  });
  it("sem código (rede) ou gateway 502/503/504/408 é incerto", () => {
    expect(ehIncerta({ code: "", message: "TypeError: Failed to fetch" })).toBe(true);
    expect(ehIncerta({ message: "Failed to fetch" })).toBe(true);
    expect(ehIncerta({ code: "PGRST000", status: 503 })).toBe(true);
    expect(ehIncerta({ status: 504, code: "" })).toBe(true);
  });
  it("erro local de validação (antes de enviar) não marca dúvida", () => {
    expect(falhaIncerta(new Error("Informe o valor"))).toBe(false);
  });
  it("erro com marcação explícita prevalece", () => {
    expect(falhaIncerta(Object.assign(new Error("x"), { incerta: true }))).toBe(true);
    expect(falhaIncerta(Object.assign(new Error("x"), { incerta: false }))).toBe(false);
  });
  it("erro de resposta do Supabase com código vazio (fetch falhou) é incerto", () => {
    expect(falhaIncerta({ code: "", message: "TypeError: Failed to fetch", details: "", hint: "" })).toBe(true);
  });
});
