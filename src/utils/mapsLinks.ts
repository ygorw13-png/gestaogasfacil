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

/** Link de rota (navegação passo a passo) até o endereço. */
export function mapsRouteUrl(addr: any): string {
  const q = encodeURIComponent(formatAddress(addr) || "");
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
}

/** Link de busca simples do endereço no Maps. */
export function mapsSearchUrl(addr: any): string {
  const q = encodeURIComponent(formatAddress(addr) || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function mapsCoordUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
