import { describe, it, expect } from "vitest";
import { ambienteNumero, motivoNaoAtivar, classificar, impedimento, parametrosAviso, NOMES_FORMA, TEXTO_MODELO, EXEMPLO_MODELO, param } from "./whatsapp-core";
import { FORMAS_PAGAMENTO } from "../../../src/lib/formasPagamento";

describe("aviso de entrega pelo WhatsApp", () => {
  it("parâmetros: pedido, cliente, endereço, produto, quantidade, valor, forma, observações", () => {
    const p = parametrosAviso({ id: "9899b5ca-0000-4000-8000-000000000000", client_name: "Cliente Teste", address: { street: "Rua A", number: "10", neighborhood: "Centro" },
      product: "GLP P13", quantity: 2, price: 240, payment_method: "gas-povo", notes: "Portão\nazul" });
    expect(p).toEqual(["#9899B5CA", "Cliente Teste", "Rua A, 10, Centro", "GLP P13", "2", "R$ 240,00", "Gás do Povo", "Portão azul"]);
  });
  it("valor não informado não vira zero; nenhum parâmetro vazio", () => {
    const p = parametrosAviso({ id: "a", client_name: "", price: null, payment_method: null, notes: null });
    expect(p[5]).toBe("não informado");
    expect(p.every((x) => x.length > 0)).toBe(true);
    expect(param("  a \t b  ")).toBe("a b");
  });
  it("modelo tem 8 variáveis e 8 exemplos", () => {
    expect(TEXTO_MODELO.match(/\{\{\d\}\}/g)).toHaveLength(8);
    expect(EXEMPLO_MODELO).toHaveLength(8);
  });
  it("nomes das formas iguais aos da tela", () => {
    for (const f of FORMAS_PAGAMENTO) expect(NOMES_FORMA[f.codigo]).toBe(f.nome);
  });
  it("classificação: enviado à plataforma, falha, incerto", () => {
    expect(classificar(200, '{"messages":[{"id":"wamid.X"}]}')).toEqual({ status: "enviado", id: "wamid.X", erro: null });
    expect(classificar(400, '{"error":{"message":"Invalid parameter"}}').status).toBe("falha");
    expect(classificar(429, "rate").status).toBe("falha");
    expect(classificar(502, "bad gateway").status).toBe("incerto");
    expect(classificar(200, "{}").status).toBe("incerto");
    expect(classificar(null, "timeout").status).toBe("incerto");
  });
  it("sem conexão / sem modelo / envio desativado: não envia", () => {
    expect(impedimento({ modelo: "m", envio_ativo: true }, false)).toMatch(/não conectado/);
    expect(impedimento({ modelo: null, envio_ativo: true }, true)).toMatch(/Modelo/);
    expect(impedimento({ modelo: "m", envio_ativo: true, provedor: "desktop" }, true)).toMatch(/Aplicativo do PC/);
    expect(impedimento({ modelo: "m", envio_ativo: false }, true)).toMatch(/não ativado/);
    expect(impedimento({ modelo: "m", envio_ativo: true }, true)).toBeNull();
  });
  it("número +1 555 ou sandbox é teste; número real é produção", () => {
    expect(ambienteNumero({ display_phone_number: "+1 555-821-2628" })).toBe("teste");
    expect(ambienteNumero({ display_phone_number: "+55 75 99999-0000", account_mode: "SANDBOX" })).toBe("teste");
    expect(ambienteNumero({ display_phone_number: "+55 75 99999-0000", account_mode: "LIVE" })).toBe("producao");
    expect(ambienteNumero(null)).toBe("desconhecido");
  });
  it("envio automático só liga com número real e modelo aprovado", () => {
    expect(motivoNaoAtivar("teste", "APPROVED")).toMatch(/teste/);
    expect(motivoNaoAtivar("producao", "PENDING")).toMatch(/aprovado/);
    expect(motivoNaoAtivar("desconhecido", "APPROVED")).not.toBeNull();
    expect(motivoNaoAtivar("producao", "APPROVED")).toBeNull();
  });
});
