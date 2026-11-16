import { describe, it, expect } from "vitest";
import { normalizarForma, rotuloForma, valorParaForma, lerValor, FORMAS_PAGAMENTO } from "./formasPagamento";

describe("formas de pagamento", () => {
  it("cada uma das oito modalidades mantém o próprio código e rótulo", () => {
    const esperado: Record<string, string> = {
      money: "Dinheiro", pix: "PIX", credit: "Crédito", debit: "Débito", promissoria: "Promissória",
      "vale-gas": "Vale Gás", "gas-povo": "Gás do Povo", convenio: "Convênio",
    };
    expect(FORMAS_PAGAMENTO.map((f) => f.codigo).sort()).toEqual(Object.keys(esperado).sort());
    for (const [c, r] of Object.entries(esperado)) {
      expect(normalizarForma(c)).toBe(c);
      expect(rotuloForma(c)).toBe(r);
    }
  });

  it("Gás do Povo nunca vira Convênio", () => {
    for (const g of ["gasPovo", "gas-povo", "Gás do Povo", "gas_do_povo", "Gás-Povo"]) {
      expect(normalizarForma(g)).toBe("gas-povo");
      expect(rotuloForma(g)).toBe("Gás do Povo");
    }
  });

  it("crédito e débito ficam separados", () => {
    expect(normalizarForma("Cartão de Crédito")).toBe("credit");
    expect(normalizarForma("Cartão de Débito")).toBe("debit");
  });

  it("forma desconhecida ou ambígua não vira outra modalidade", () => {
    expect(normalizarForma("")).toBeNull();
    expect(normalizarForma("cartao")).toBeNull();
    expect(normalizarForma("boleto")).toBeNull();
    expect(rotuloForma("boleto")).toBe("Outros");
    expect(() => valorParaForma("", 10)).toThrow(/inválida/);
  });

  it("as cinco obrigatórias recusam valor vazio ou zero e aceitam valor válido", () => {
    for (const f of ["promissoria", "pix", "money", "credit", "debit"]) {
      expect(() => valorParaForma(f, null)).toThrow(/maior que zero/);
      expect(() => valorParaForma(f, 0)).toThrow(/maior que zero/);
      expect(valorParaForma(f, 108)).toBe(108);
    }
  });

  it("as três opcionais aceitam ausência de valor sem inventar preço", () => {
    for (const f of ["vale-gas", "gas-povo", "convenio"]) {
      expect(valorParaForma(f, null)).toBeNull();
      expect(valorParaForma(f, 0)).toBeNull();
      expect(valorParaForma(f, 95.5)).toBe(95.5);
      expect(() => valorParaForma(f, -1)).toThrow();
    }
  });

  it("lê valor com vírgula ou ponto", () => {
    expect(lerValor("108,50")).toBe(108.5);
    expect(lerValor("1.108,50")).toBe(1108.5);
    expect(lerValor("108.5")).toBe(108.5);
    expect(lerValor("")).toBeNull();
    expect(Number.isNaN(lerValor("abc") as number)).toBe(true);
  });
});
