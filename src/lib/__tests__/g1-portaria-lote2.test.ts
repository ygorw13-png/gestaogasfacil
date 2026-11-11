/** Lote 2: data operacional America/Bahia (mesma regra de public.data_operacional()). */
import { describe, it, expect } from "vitest";
import { dataOperacional, dataUTC, somarDias } from "../dataOperacional";

describe("data operacional (America/Bahia)", () => {
  it("22:30 em Bahia ainda é o mesmo dia, embora em UTC já seja amanhã", () => {
    const d = new Date("2026-11-11T01:30:00Z"); // 22:30 de 10/11 em Bahia
    expect(dataOperacional(d)).toBe("2026-11-10");
    expect(dataUTC(d)).toBe("2026-11-11");
  });
  it("virada à meia-noite de Bahia (03:00 UTC)", () => {
    expect(dataOperacional(new Date("2026-11-11T02:59:59Z"))).toBe("2026-11-10");
    expect(dataOperacional(new Date("2026-11-11T03:00:00Z"))).toBe("2026-11-11");
  });
  it("durante o dia as duas datas coincidem (janela segura de ativação)", () => {
    const d = new Date("2026-11-10T14:00:00Z");
    expect(dataOperacional(d)).toBe(dataUTC(d));
  });
  it("virada de ano", () => {
    expect(dataOperacional(new Date("2027-01-01T02:00:00Z"))).toBe("2026-12-31");
  });
  it("somarDias independe do fuso da máquina", () => {
    expect(somarDias("2026-11-10", -1)).toBe("2026-11-09");
    expect(somarDias("2026-02-28", 1)).toBe("2026-03-01");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});
