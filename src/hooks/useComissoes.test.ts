import { describe, it, expect } from "vitest";
import { grupoPagamento, comissaoVenda } from "./useComissoes";

const perc = { modo: "percentual", perc_dinheiro: 2, perc_pix: 3, perc_cartao: 0, fixo_por_botijao: 5 };
const fixo = { ...perc, modo: "fixo" };

describe("comissões por forma de pagamento", () => {
  it("Dinheiro, Crédito e Débito usam a taxa da própria modalidade", () => {
    expect(grupoPagamento("money")).toBe("dinheiro");
    expect(grupoPagamento("credit")).toBe("cartao");
    expect(grupoPagamento("debit")).toBe("cartao");
    expect(comissaoVenda(perc, "money", 100, 1).comissao).toBe(2);
    expect(comissaoVenda(perc, "pix", 100, 1).comissao).toBe(3);
  });
  it("taxa zero é configuração válida (não é falta de taxa)", () => {
    expect(comissaoVenda(perc, "credit", 100, 1)).toEqual({ grupo: "cartao", comissao: 0, semTaxa: false });
  });
  it("promissória só no recebimento, nos dois modos", () => {
    expect(comissaoVenda(perc, "promissoria", 100, 1).comissao).toBe(0);
    expect(comissaoVenda(fixo, "promissoria", 100, 2).comissao).toBe(0);
  });
  it("Vale-gás, Gás do Povo e Convênio ficam sem taxa, sem virar outra modalidade", () => {
    for (const f of ["vale-gas", "gas-povo", "convenio"]) {
      expect(comissaoVenda(perc, f, 100, 1)).toEqual({ grupo: f, comissao: 0, semTaxa: true });
    }
    expect(comissaoVenda(perc, "boleto", 100, 1)).toEqual({ grupo: "nao-reconhecida", comissao: 0, semTaxa: true });
  });
  it("modo fixo por botijão mantém a regra existente", () => {
    expect(comissaoVenda(fixo, "debit", 100, 2).comissao).toBe(10);
  });
});
