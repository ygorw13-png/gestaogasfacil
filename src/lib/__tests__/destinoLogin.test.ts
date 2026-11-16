import { describe, it, expect } from "vitest";
import { destinoAposLogin } from "@/utils/destinoLogin";

describe("destino após login", () => {
  it("preserva o pedido do link do aviso", () => {
    const id = "4ef22f85-a194-429d-86cb-0a2c8b336cae";
    expect(destinoAposLogin({ pathname: "/entregador/entregas", search: `?pedido=${id}` })).toBe(`/entregador/entregas?pedido=${id}`);
  });
  it("sem origem ou origem externa vai para a raiz", () => {
    expect(destinoAposLogin(undefined)).toBe("/");
    expect(destinoAposLogin({ pathname: "//evil.example/x" })).toBe("/");
    expect(destinoAposLogin({ pathname: "https://evil.example" })).toBe("/");
    expect(destinoAposLogin({ pathname: "/login", search: "?x=1" })).toBe("/");
  });
});
