/** Fila offline: lançamento de uma conta nunca sobe pela sessão de outra; recusa do servidor não vira "na fila". */
import { describe, it, expect } from "vitest";
import { decidirEnvio, ehRecusaDefinitiva } from "../dono";

describe("dono do lançamento offline", () => {
  it("mesma conta envia", () => expect(decidirEnvio("u1", "u1")).toBe("enviar"));
  it("outra conta logada: não envia, espera a conta dona", () => expect(decidirEnvio("u1", "u2")).toBe("outra_conta"));
  it("ninguém logado: aguarda", () => expect(decidirEnvio("u1", null)).toBe("aguardar_sessao"));
  it("lançamento antigo sem dono: pede confirmação; confirmado, envia", () => {
    expect(decidirEnvio(undefined, "u2")).toBe("sem_dono");
    expect(decidirEnvio(undefined, "u2", true)).toBe("enviar");
  });
  it("confirmar não libera lançamento de OUTRA conta", () => expect(decidirEnvio("u1", "u2", true)).toBe("outra_conta"));
  it("ambiente sem autenticação (testes) não bloqueia", () => expect(decidirEnvio("u1", undefined)).toBe("enviar"));
});

describe("recusa definitiva", () => {
  const rede = (m: string) => /network|fetch|timeout|offline/i.test(m);
  it("ação controlada recusada pelo servidor não é reenviada sozinha", () =>
    expect(ehRecusaDefinitiva("rpc", "Carga insuficiente para P13", rede)).toBe(true));
  it("falha de rede continua na fila", () => expect(ehRecusaDefinitiva("rpc", "TypeError: Failed to fetch", rede)).toBe(false));
  it("gravação direta (insert) mantém a regra antiga de tentativas", () => expect(ehRecusaDefinitiva("insert", "erro", rede)).toBe(false));
});
