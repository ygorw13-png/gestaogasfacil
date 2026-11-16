// WhatsApp por QR code (opcional, sem Facebook) via Evolution API v2, integração WHATSAPP-BAILEYS.
// A sessão do WhatsApp Web vive num servidor Evolution externo e persistente; esta função só o consulta.
// Endereço e chave vêm apenas dos secrets do servidor (nunca do cliente). Instância derivada da empresa.
// Este módulo não envia mensagens nem toca na fila/configuração de envio automático.

export const QR_VALIDADE_MS = 40_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Servidor = { ok: true; base: string; chave: string } | { ok: false; motivo: string };
export type Busca = (url: string, init: RequestInit) => Promise<Response>;
export type Resultado = { status: number; body: Record<string, unknown> };

export const SERVIDOR_NAO_CONFIGURADO = "Servidor não configurado";

/** Lê só EVOLUTION_API_URL/EVOLUTION_API_KEY. Exige https e URL sem usuário/senha, consulta ou fragmento. */
export function configServidor(env: { url?: string | null; chave?: string | null }): Servidor {
  const url = (env.url ?? "").trim();
  const chave = (env.chave ?? "").trim();
  if (!url || !chave) return { ok: false, motivo: SERVIDOR_NAO_CONFIGURADO };
  let u: URL;
  try { u = new URL(url); } catch { return { ok: false, motivo: `${SERVIDOR_NAO_CONFIGURADO}: endereço inválido` }; }
  if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash) {
    return { ok: false, motivo: `${SERVIDOR_NAO_CONFIGURADO}: o endereço precisa ser https, sem senha nem parâmetros` };
  }
  return { ok: true, base: `${u.origin}${u.pathname.replace(/\/+$/, "")}`, chave };
}

/** Uma instância por empresa; o nome nunca vem do cliente. */
export function nomeInstancia(org: string): string {
  if (!UUID.test(org)) throw new Error("Empresa inválida");
  return `gasfacil-${org.toLowerCase()}`;
}

/** Aceita só imagem PNG em base64 devolvida pelo servidor. */
export function qrValido(v: unknown): string | null {
  return typeof v === "string" && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length > 100 ? v : null;
}

export function qrExpirado(expiraEm: string | null | undefined, agora: number): boolean {
  const t = expiraEm ? Date.parse(expiraEm) : NaN;
  return !Number.isFinite(t) || agora >= t;
}

// deno-lint-ignore no-explicit-any
type Instancia = { nome: string; dono: string | null; perfil: string | null };

/** fetchInstances muda de formato entre versões; filtra pelo nome exato para nunca expor outra empresa. */
// deno-lint-ignore no-explicit-any
export function acharInstancia(dados: any, nome: string): Instancia | null {
  const lista = Array.isArray(dados) ? dados : dados ? [dados] : [];
  for (const item of lista) {
    const i = item?.instance ?? item;
    const n = i?.name ?? i?.instanceName;
    if (n !== nome) continue;
    const jid = String(i?.ownerJid ?? i?.owner ?? "");
    const dono = jid.split("@")[0].replace(/\D/g, "") || null;
    return { nome, dono, perfil: typeof i?.profileName === "string" ? i.profileName : null };
  }
  return null;
}

async function chamar(s: Extract<Servidor, { ok: true }>, busca: Busca, method: string, path: string, body?: unknown) {
  try {
    const r = await busca(`${s.base}${path}`, {
      method,
      headers: { apikey: s.chave, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const texto = await r.text();
    let dados: unknown = null;
    try { dados = JSON.parse(texto); } catch { dados = null; }
    if (!r.ok) console.error(`Evolution ${method} ${path.split("?")[0].split("/").slice(0, 3).join("/")} [${r.status}]`);
    return { http: r.status, ok: r.ok, dados };
  } catch {
    console.error(`Evolution ${method} sem resposta`);
    return { http: null as number | null, ok: false, dados: null as unknown };
  }
}

async function consultarEstado(s: Extract<Servidor, { ok: true }>, busca: Busca, nome: string) {
  const lista = await chamar(s, busca, "GET", `/instance/fetchInstances?instanceName=${encodeURIComponent(nome)}`);
  if (!lista.ok && lista.http !== 404) return { erro: `Servidor Evolution não respondeu [${lista.http ?? "sem resposta"}]` } as const;
  const inst = lista.ok ? acharInstancia(lista.dados, nome) : null;
  if (!inst) return { existe: false, estado: "inexistente", conectado: false, numero: null, perfil: null } as const;
  const st = await chamar(s, busca, "GET", `/instance/connectionState/${encodeURIComponent(nome)}`);
  // deno-lint-ignore no-explicit-any
  const estado = st.ok ? String((st.dados as any)?.instance?.state ?? (st.dados as any)?.state ?? "desconhecido") : "desconhecido";
  const conectado = estado === "open"; // só o servidor confirma a conexão
  return { existe: true, estado, conectado, numero: conectado ? inst.dono : null, perfil: conectado ? inst.perfil : null } as const;
}

/**
 * Ações: "estado" e "conectar". Autorização (admin) e empresa já resolvidas no servidor e repassadas aqui.
 * Sem servidor configurado não faz nenhuma chamada externa.
 */
export async function executarAcao(p: {
  acao: unknown; org: string | null; ehAdmin: boolean; servidor: Servidor; busca: Busca; agora: number;
}): Promise<Resultado> {
  if (!p.ehAdmin || !p.org) return { status: 403, body: { error: "Só o administrador" } };
  const acao = p.acao === "conectar" ? "conectar" : p.acao === "estado" || p.acao == null ? "estado" : null;
  if (!acao) return { status: 400, body: { error: "Ação inválida" } };
  const nome = nomeInstancia(p.org);
  if (!p.servidor.ok) {
    return { status: acao === "estado" ? 200 : 409, body: { servidor_configurado: false, motivo: p.servidor.motivo, conectado: false } };
  }
  const s = p.servidor;
  const atual = await consultarEstado(s, p.busca, nome);
  if ("erro" in atual) return { status: 502, body: { servidor_configurado: true, conectado: false, error: atual.erro } };
  if (acao === "estado" || atual.conectado) {
    return { status: 200, body: { servidor_configurado: true, instancia: nome, ...atual } };
  }
  if (!atual.existe) {
    const c = await chamar(s, p.busca, "POST", "/instance/create", { instanceName: nome, integration: "WHATSAPP-BAILEYS", qrcode: true });
    if (!c.ok) return { status: 502, body: { servidor_configurado: true, conectado: false, error: `Servidor não criou a instância [${c.http ?? "sem resposta"}]` } };
  }
  const q = await chamar(s, p.busca, "GET", `/instance/connect/${encodeURIComponent(nome)}`);
  // deno-lint-ignore no-explicit-any
  const qr = q.ok ? qrValido((q.dados as any)?.base64 ?? (q.dados as any)?.qrcode?.base64) : null;
  if (!qr) return { status: 502, body: { servidor_configurado: true, conectado: false, error: `Servidor não devolveu QR code [${q.http ?? "sem resposta"}]` } };
  return {
    status: 200,
    body: {
      servidor_configurado: true, instancia: nome, existe: true, estado: "connecting", conectado: false, numero: null,
      qr, gerado_em: new Date(p.agora).toISOString(), expira_em: new Date(p.agora + QR_VALIDADE_MS).toISOString(),
    },
  };
}
