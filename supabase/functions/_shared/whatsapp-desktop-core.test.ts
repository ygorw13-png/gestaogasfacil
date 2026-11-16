import { describe, it, expect, vi } from "vitest";
import { processar, sha256Hex, novoToken, type Rpc } from "./whatsapp-desktop-core";

const TOKEN = "t".repeat(43);
const COD = "a".repeat(64);
const JOB = "11111111-1111-4111-8111-111111111111";
const rpcCom = (data: unknown) => vi.fn<Rpc>(async () => ({ data, error: null }));
const req = (body: unknown, auth: string | null = `Bearer ${TOKEN}`, method = "POST") =>
  ({ method, authorization: auth, corpo: typeof body === "string" ? body : JSON.stringify(body), origem: "10.0.0.1" });

describe("whatsapp-desktop protocolo 1", () => {
  it("pair devolve token novo e envia só hashes ao banco", async () => {
    const rpc = rpcCom({ device_id: JOB, company_name: "Empresa", expected_phone: "557533330000" });
    const s = await processar(req({ action: "pair", pairing_code: COD, device_name: "PC", protocol_version: 1 }, null), rpc, () => TOKEN);
    expect(s).toEqual({ status: 200, body: { device_id: JOB, device_token: TOKEN, company_name: "Empresa", expected_phone: "557533330000" } });
    const args = rpc.mock.calls[0][1];
    expect(args._codigo_hash).toBe(await sha256Hex(COD));
    expect(args._token_hash).toBe(await sha256Hex(TOKEN));
    expect(JSON.stringify(args)).not.toContain(COD);
    expect(JSON.stringify(args)).not.toContain(TOKEN);
  });
  it("pair exige protocol_version 1", async () => {
    const s = await processar(req({ action: "pair", pairing_code: COD, device_name: "PC", protocol_version: 2 }, null), rpcCom({}));
    expect(s.status).toBe(400);
  });
  it("erros do banco viram HTTP com {error}", async () => {
    const s = await processar(req({ action: "pair", pairing_code: COD, device_name: "PC", protocol_version: 1 }, null),
      rpcCom({ error: "Código de pareamento inválido, expirado ou já usado", status: 401 }));
    expect(s).toEqual({ status: 401, body: { error: "Código de pareamento inválido, expirado ou já usado" } });
  });
  it("demais ações exigem Bearer", async () => {
    const rpc = rpcCom({ job: null });
    const s = await processar(req({ action: "poll", phone: "557533330000" }, null), rpc);
    expect(s.status).toBe(401); expect(rpc).not.toHaveBeenCalled();
  });
  it("telefone fora do E164 BR é recusado", async () => {
    for (const phone of ["+557533330000", "7533330000", "55 75 3333-0000"]) {
      expect((await processar(req({ action: "poll", phone }), rpcCom({ job: null }))).status).toBe(400);
    }
  });
  it("heartbeat valida campos e responde {ok:true}", async () => {
    const ok = await processar(req({ action: "heartbeat", state: "connected", phone: null, paused: false, app_version: "1.0.0" }), rpcCom({ ok: true }));
    expect(ok).toEqual({ status: 200, body: { ok: true } });
    expect((await processar(req({ action: "heartbeat", state: "online", phone: null, paused: false, app_version: "1.0.0" }), rpcCom({}))).status).toBe(400);
  });
  it("poll devolve {job:null} ou o job do banco", async () => {
    expect((await processar(req({ action: "poll", phone: "557533330000" }), rpcCom({ job: null }))).body).toEqual({ job: null });
  });
  it("begin devolve allowed booleano", async () => {
    const s = await processar(req({ action: "begin", job_id: JOB, attempt_token: COD, phone: "557533330000" }), rpcCom({ allowed: false }));
    expect(s.body).toEqual({ allowed: false });
  });
  it("result só aceita sent/failed/uncertain", async () => {
    expect((await processar(req({ action: "result", job_id: JOB, attempt_token: COD, outcome: "delivered" }), rpcCom({}))).status).toBe(400);
    expect((await processar(req({ action: "result", job_id: JOB, attempt_token: COD, outcome: "sent", message_id: "x" }), rpcCom({ ok: true }))).body).toEqual({ ok: true });
  });
  it("método, JSON e action inválidos", async () => {
    expect((await processar(req({}, null, "GET"), rpcCom({}))).status).toBe(405);
    expect((await processar(req("nao-json"), rpcCom({}))).status).toBe(400);
    expect((await processar(req({ action: "send", to: "557533330000", text: "oi" }), rpcCom({}))).status).toBe(400);
  });
  it("erro interno do banco não vaza detalhe", async () => {
    const rpc = vi.fn<Rpc>(async () => ({ data: null, error: { message: "detalhe interno" } }));
    const s = await processar(req({ action: "poll", phone: "557533330000" }), rpc);
    expect(s).toEqual({ status: 500, body: { error: "Erro interno" } });
  });
  it("token do dispositivo tem 256 bits", () => {
    expect(novoToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("compatibilidade com o cliente Windows", () => {
  it("pairing_code base64url/hex de 22 a 256 caracteres; fora disso 400", async () => {
    const ok = rpcCom({ device_id: JOB, company_name: "E", expected_phone: "557533330000" });
    for (const cod of ["A".repeat(22), "f".repeat(256), "Ab_-".repeat(10)]) {
      expect((await processar(req({ action: "pair", pairing_code: cod, device_name: "PC", protocol_version: 1 }, null), ok, () => TOKEN)).status).toBe(200);
    }
    for (const cod of ["A".repeat(21), "f".repeat(257), "a+b/".repeat(8)]) {
      expect((await processar(req({ action: "pair", pairing_code: cod, device_name: "PC", protocol_version: 1 }, null), ok)).status).toBe(400);
    }
  });
  it("token de 32+ caracteres aceito; menor recusado", async () => {
    const r = rpcCom({ job: null });
    expect((await processar(req({ action: "poll", phone: "557533330000" }, `Bearer ${"z".repeat(32)}`), r)).status).toBe(200);
    expect((await processar(req({ action: "poll", phone: "557533330000" }, `Bearer ${"z".repeat(31)}`), r)).status).toBe(401);
  });
});
