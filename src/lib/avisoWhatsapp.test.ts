import { describe, it, expect } from "vitest";
import { CANAIS_AVISO, resumoEnvio } from "./avisoWhatsapp";
import { impedimentoAviso } from "@/hooks/useEntregadoresApp";

describe("canal do aviso na atribuição", () => {
  it("só existem App + WhatsApp e Só WhatsApp (nunca só app / sem WhatsApp)", () => {
    expect(CANAIS_AVISO.map((c) => c.rotulo)).toEqual(["App + WhatsApp", "Só WhatsApp"]);
  });
  it("Só WhatsApp indisponível até o sistema receber respostas", () => {
    expect(CANAIS_AVISO.find((c) => c.valor === "whatsapp")?.disponivel).toBe(false);
  });
  it("exige vínculo com a conta e telefone válido", () => {
    expect(impedimentoAviso({ id: "1", nome: "A", vinculado: false, telefoneValido: false, telefoneFinal: null })).toMatch(/vinculado/);
    expect(impedimentoAviso({ id: "1", nome: "A", vinculado: true, telefoneValido: false, telefoneFinal: null })).toMatch(/inválido/);
    expect(impedimentoAviso({ id: "1", nome: "A", vinculado: true, telefoneValido: true, telefoneFinal: "0001" })).toBeNull();
  });
  it("enviado à plataforma não é aceite; falha e incerto pedem ação", () => {
    expect(resumoEnvio([{ envio_id: "e", status: "enviado" }])).toMatchObject({ ok: true });
    expect(resumoEnvio([{ envio_id: "e", status: "enviado" }]).texto).toMatch(/não é o aceite/);
    expect(resumoEnvio([{ envio_id: "e", status: "falha", erro: "WhatsApp da empresa não conectado" }])).toEqual({ ok: false, texto: "WhatsApp da empresa não conectado" });
    expect(resumoEnvio([{ envio_id: "e", status: "incerto", erro: "timeout" }]).texto).toMatch(/Confira no celular/);
  });
});
