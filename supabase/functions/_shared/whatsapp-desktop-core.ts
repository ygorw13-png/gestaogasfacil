// Núcleo da integração "Aplicativo do PC" (protocolo versão 1). Sem dependências: testado pelo vitest.
// O app Windows só faz POST HTTPS de saída. Códigos, tokens de dispositivo e de tentativa chegam ao banco só como hash.

export const PROTOCOLO = 1;
export const MAX_CORPO = 8 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SEGREDO = /^[A-Za-z0-9_-]{32,128}$/;
const TELEFONE = /^55[0-9]{10,11}$/;
const CODIGO_ERRO = /^[A-Za-z0-9_.:-]{1,80}$/;

export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
export interface Entrada { method: string; authorization: string | null; corpo: string; origem: string }
export interface Saida { status: number; body: Record<string, unknown> }

export const HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Pragma: "no-cache" };

export async function sha256Hex(t: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 256 bits aleatórios em base64url (43 caracteres). */
export function novoToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const erro = (status: number, msg: string): Saida => ({ status, body: { error: msg } });
const telefone = (v: unknown) => typeof v === "string" && TELEFONE.test(v);

function bearer(h: string | null): string | null {
  const m = /^Bearer ([A-Za-z0-9_-]{32,128})$/.exec(h ?? "");
  return m ? m[1] : null;
}

/** Converte o retorno jsonb das funções do banco ({error,status} ou dados) na resposta HTTP. */
function doBanco(r: { data: unknown; error: { message: string } | null }, ok: (d: Record<string, unknown>) => Record<string, unknown>): Saida {
  if (r.error) { console.error("whatsapp-desktop rpc:", r.error.message); return erro(500, "Erro interno"); }
  const d = (r.data ?? {}) as Record<string, unknown>;
  if (typeof d.error === "string") return erro(typeof d.status === "number" ? d.status : 400, d.error);
  return { status: 200, body: ok(d) };
}

export async function processar(e: Entrada, rpc: Rpc, gerarToken: () => string = novoToken): Promise<Saida> {
  if (e.method !== "POST") return erro(405, "Use POST");
  if (e.corpo.length > MAX_CORPO) return erro(413, "Corpo grande demais");
  let b: Record<string, unknown>;
  try {
    const j = JSON.parse(e.corpo);
    if (!j || typeof j !== "object" || Array.isArray(j)) return erro(400, "JSON inválido");
    b = j;
  } catch { return erro(400, "JSON inválido"); }
  const origem = e.origem.slice(0, 64) || "?";

  if (b.action === "pair") {
    if (b.protocol_version !== PROTOCOLO) return erro(400, "protocol_version não suportado");
    if (typeof b.pairing_code !== "string" || !SEGREDO.test(b.pairing_code)) return erro(400, "pairing_code inválido");
    if (typeof b.device_name !== "string" || !b.device_name.trim() || b.device_name.length > 80) return erro(400, "device_name inválido");
    const token = gerarToken();
    const r = await rpc("whatsapp_desktop_parear", {
      _codigo_hash: await sha256Hex(b.pairing_code), _nome: b.device_name.trim(), _token_hash: await sha256Hex(token), _origem: origem,
    });
    return doBanco(r, (d) => ({ device_id: d.device_id, device_token: token, company_name: d.company_name ?? null, expected_phone: d.expected_phone }));
  }

  const token = bearer(e.authorization);
  if (!token) return erro(401, "Authorization Bearer ausente ou inválido");
  const th = await sha256Hex(token);

  switch (b.action) {
    case "heartbeat": {
      if (b.state !== "connected" && b.state !== "disconnected") return erro(400, "state inválido");
      if (b.phone !== null && !telefone(b.phone)) return erro(400, "phone inválido (E164 BR, só dígitos)");
      if (typeof b.paused !== "boolean") return erro(400, "paused inválido");
      if (typeof b.app_version !== "string" || !/^[0-9A-Za-z.+-]{1,20}$/.test(b.app_version)) return erro(400, "app_version inválido");
      return doBanco(await rpc("whatsapp_desktop_heartbeat", {
        _token_hash: th, _estado: b.state, _telefone: b.phone, _pausado: b.paused, _versao: b.app_version, _origem: origem,
      }), () => ({ ok: true }));
    }
    case "poll": {
      if (!telefone(b.phone)) return erro(400, "phone inválido (E164 BR, só dígitos)");
      return doBanco(await rpc("whatsapp_desktop_poll", { _token_hash: th, _telefone: b.phone, _origem: origem }), (d) => ({ job: d.job ?? null }));
    }
    case "begin": {
      if (typeof b.job_id !== "string" || !UUID.test(b.job_id)) return erro(400, "job_id inválido");
      if (typeof b.attempt_token !== "string" || !SEGREDO.test(b.attempt_token)) return erro(400, "attempt_token inválido");
      if (!telefone(b.phone)) return erro(400, "phone inválido (E164 BR, só dígitos)");
      return doBanco(await rpc("whatsapp_desktop_begin", {
        _token_hash: th, _job: b.job_id, _tentativa: b.attempt_token, _telefone: b.phone, _origem: origem,
      }), (d) => ({ allowed: d.allowed === true }));
    }
    case "result": {
      if (typeof b.job_id !== "string" || !UUID.test(b.job_id)) return erro(400, "job_id inválido");
      if (typeof b.attempt_token !== "string" || !SEGREDO.test(b.attempt_token)) return erro(400, "attempt_token inválido");
      if (b.outcome !== "sent" && b.outcome !== "failed" && b.outcome !== "uncertain") return erro(400, "outcome inválido");
      if (b.message_id !== undefined && b.message_id !== null && (typeof b.message_id !== "string" || b.message_id.length > 200)) return erro(400, "message_id inválido");
      if (b.error_code !== undefined && b.error_code !== null && (typeof b.error_code !== "string" || !CODIGO_ERRO.test(b.error_code))) return erro(400, "error_code inválido");
      return doBanco(await rpc("whatsapp_desktop_resultado", {
        _token_hash: th, _job: b.job_id, _tentativa: b.attempt_token, _resultado: b.outcome,
        _message_id: b.message_id ?? null, _erro: b.error_code ?? null, _origem: origem,
      }), () => ({ ok: true }));
    }
    default:
      return erro(400, "action inválida");
  }
}
