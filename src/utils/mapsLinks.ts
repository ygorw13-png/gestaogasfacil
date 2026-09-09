/** Cidade/UF usada quando o endereço cadastrado não informa a cidade. */
export const CIDADE_PADRAO = "";

export function formatAddress(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [
    [addr.street, addr.number].filter(Boolean).join(", "),
    addr.complement,
    addr.neighborhood,
    addr.city,
    addr.cep ?? addr.zip,
  ].filter(Boolean);
  return parts.join(" - ");
}

/**
 * Versão do endereço usada nos links do Google Maps.
 * Remove o complemento (ex.: "casa de plana na frente"), que costuma impedir
 * o Maps de encontrar o local, e completa com a cidade padrão quando faltar.
 */
export function geocodableAddress(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") {
    const s = addr.trim();
    if (!s) return "";
    return CIDADE_PADRAO && !s.toLowerCase().includes(CIDADE_PADRAO.split(",")[0].toLowerCase())
      ? `${s}, ${CIDADE_PADRAO}`
      : s;
  }

  const cep = addr.cep ?? addr.zip;
  const parts = [
    [addr.street, addr.number].filter(Boolean).join(", "),
    addr.neighborhood,
    addr.city,
    addr.state ?? addr.uf,
    cep,
  ]
    .map((p: any) => (typeof p === "string" ? p.trim() : p))
    .filter(Boolean);

  if (!parts.length) return "";
  if (!addr.city && CIDADE_PADRAO) parts.push(CIDADE_PADRAO);
  return parts.join(", ");
}

/** Link de rota (navegação passo a passo) até o endereço. */
export function mapsRouteUrl(addr: any): string {
  const q = encodeURIComponent(geocodableAddress(addr));
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
}

/** Link de busca simples do endereço no Maps. */
export function mapsSearchUrl(addr: any): string {
  const q = encodeURIComponent(geocodableAddress(addr));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function mapsCoordUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** true quando não há dados suficientes para abrir o mapa. */
export function hasMapAddress(addr: any): boolean {
  return geocodableAddress(addr).length > 3;
}
