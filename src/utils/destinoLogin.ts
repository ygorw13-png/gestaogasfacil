/**
 * Destino depois do login: volta para a página que pediu login, com a busca (?pedido=...) preservada.
 * Só caminhos internos do app; qualquer outra coisa vai para a raiz (que decide pelo papel).
 */
export function destinoAposLogin(from: unknown): string {
  const f = from as { pathname?: unknown; search?: unknown; hash?: unknown } | null | undefined;
  const p = typeof f?.pathname === "string" ? f.pathname : "";
  if (!p.startsWith("/") || p.startsWith("//") || p.startsWith("/login")) return "/";
  const s = typeof f?.search === "string" && f.search.startsWith("?") ? f.search : "";
  const h = typeof f?.hash === "string" && f.hash.startsWith("#") ? f.hash : "";
  return p + s + h;
}
