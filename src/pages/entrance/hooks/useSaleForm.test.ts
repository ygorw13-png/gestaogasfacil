import { describe, it, expect } from "vitest";
import { dadosVendaRegular } from "./useSaleForm";

describe("venda regular em Nota promissória", () => {
  it("cliente comum: grava R$ 240 e o id do cliente", () => {
    expect(dadosVendaRegular({ forma: "promissoria", total: 2 * 120, cliente: { id: "c1", origem: "cliente" } }))
      .toEqual({ valor: 240, clientId: "c1" });
  });
  it("cliente cadastrado como ponto: grava R$ 240 (não zera), sem id de ponto como cliente", () => {
    expect(dadosVendaRegular({ forma: "promissoria", total: 240, cliente: { id: "p1", origem: "ponto" } }))
      .toEqual({ valor: 240, clientId: null });
  });
  it("promissória exige cliente", () => {
    expect(() => dadosVendaRegular({ forma: "promissoria", total: 240, cliente: null })).toThrow(/cliente/);
  });
  it("promissória exige total positivo", () => {
    expect(() => dadosVendaRegular({ forma: "promissoria", total: 0, cliente: { id: "p1", origem: "ponto" } })).toThrow(/maior que zero/);
  });
});
