import { afterEach, describe, expect, it, vi } from "vitest";

// Implantação 11/11/2026: o banco tem 001–010, então as ações controladas ficam ligadas por padrão.
describe("chave das ações controladas", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  it("fica ligada quando VITE_G1_ACOES não é informada", async () => {
    vi.stubEnv("VITE_G1_ACOES", "");
    vi.resetModules();
    const { G1_ACOES } = await import("@/lib/g1/flag");
    expect(G1_ACOES).toBe(true);
  });

  it("desliga só com VITE_G1_ACOES=off", async () => {
    vi.stubEnv("VITE_G1_ACOES", "off");
    vi.resetModules();
    const { G1_ACOES } = await import("@/lib/g1/flag");
    expect(G1_ACOES).toBe(false);
  });
});
