import { describe, expect, it } from "vitest";
import { acoesEntrega, dataEntrega, ehEntrega, estadoEntrega, janelaEntrega, motivoRevisao, numeroPedido } from "@/lib/entregas";

describe("fluxo de entregas (012)", () => {
  it("número do pedido vem do ID e é igual em qualquer tela", () => {
    expect(numeroPedido("3737d330-41fa-4133-8be7-339e93601f43")).toBe("#3737D330");
  });

  it("balcão, retirada e venda na rua não são entrega", () => {
    expect(ehEntrega("pedido")).toBe(true);
    expect(ehEntrega("online")).toBe(true);
    expect(ehEntrega("portaria")).toBe(false);
    expect(ehEntrega("rua")).toBe(false);
    expect(ehEntrega(null)).toBe(false);
  });

  it("usa a data prevista quando existe; senão o dia da criação em America/Bahia", () => {
    expect(dataEntrega("2026-11-20", new Date("2026-11-11T12:00:00Z"))).toBe("2026-11-20");
    // 23:30 em Bahia (02:30 UTC do dia seguinte) ainda é o dia 11
    expect(dataEntrega(null, new Date("2026-11-12T02:30:00Z"))).toBe("2026-11-11");
  });

  it("separa hoje, atrasadas e agendadas", () => {
    expect(janelaEntrega("2026-11-10", "2026-11-11")).toBe("atrasada");
    expect(janelaEntrega("2026-11-11", "2026-11-11")).toBe("hoje");
    expect(janelaEntrega("2026-11-12", "2026-11-11")).toBe("agendada");
  });

  it("diferencia aguardando aceite de recusa registrada", () => {
    expect(estadoEntrega({ status: "assigned", deliveryPersonId: "u1" })).toBe("aguardando_aceite");
    expect(estadoEntrega({ status: "pending", rejectionReason: "pneu furado" })).toBe("recusada");
    expect(estadoEntrega({ status: "pending" })).toBe("aguardando_atribuicao");
    expect(estadoEntrega({ status: "delivering", deliveryPersonId: "u1", acceptedAt: "2026-11-11T10:00:00Z" })).toBe("em_rota");
  });

  it("registro antigo sem conta do entregador pede revisão e só o administrador regulariza", () => {
    const antigo = { status: "delivering", deliveryPerson: "282b379c-a8b0-4e82-8dad-bc0afcff8ede", deliveryPersonId: null };
    expect(motivoRevisao(antigo)).toBe("Entregador registrado sem conta identificada no aplicativo");
    expect(acoesEntrega(antigo, false)).toEqual({ atribuir: false, reatribuir: false, concluir: false, regularizar: false });
    expect(acoesEntrega(antigo, true).regularizar).toBe(true);
  });

  it("em rota sem aceite registrado pede revisão", () => {
    expect(estadoEntrega({ status: "delivering", deliveryPersonId: "u1", acceptedAt: null })).toBe("revisao");
  });

  it("sem entregador mostra Atribuir; com entregador mostra Reatribuir", () => {
    expect(acoesEntrega({ status: "pending" }, false)).toMatchObject({ atribuir: true, reatribuir: false });
    expect(acoesEntrega({ status: "assigned", deliveryPersonId: "u1" }, false)).toMatchObject({ atribuir: false, reatribuir: true, concluir: true });
  });
});
