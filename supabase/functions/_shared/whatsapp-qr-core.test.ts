import { describe, it, expect, vi } from "vitest";
import { configServidor, executarAcao, nomeInstancia, qrExpirado, QR_VALIDADE_MS, type Busca } from "./whatsapp-qr-core";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const SRV = configServidor({ url: "https://evo.exemplo.test/", chave: "chave-ficticia" });
const QR = "data:image/png;base64," + "A".repeat(200);
const AGORA = Date.parse("2026-11-16T16:00:00Z");

type Rota = (url: string, init: RequestInit) => [number, unknown];
const mock = (rota: Rota) => vi.fn<Busca>(async (url, init) => { const [s, b] = rota(url, init); return new Response(JSON.stringify(b), { status: s }); });
const run = (busca: Busca, extra: Partial<Parameters<typeof executarAcao>[0]> = {}) =>
  executarAcao({ acao: "estado", org: ORG_A, ehAdmin: true, servidor: SRV, busca, agora: AGORA, ...extra });

describe("WhatsApp por QR (Evolution)", () => {
  it("autorização: não administrador ou sem empresa recebe 403 sem chamar o servidor", async () => {
    const b = mock(() => [200, []]);
    expect((await run(b, { ehAdmin: false, acao: "conectar" })).status).toBe(403);
    expect((await run(b, { org: null })).status).toBe(403);
    expect(b).not.toHaveBeenCalled();
  });

  it("falta de configuração: 'Servidor não configurado' sem nenhuma chamada externa", async () => {
    const b = mock(() => [200, []]);
    for (const env of [{}, { url: "https://x.test" }, { chave: "k" }]) {
      const r = await run(b, { servidor: configServidor(env), acao: "conectar" });
      expect(r.status).toBe(409);
      expect(r.body).toMatchObject({ servidor_configurado: false, conectado: false });
      expect(String(r.body.motivo)).toMatch(/Servidor não configurado/);
    }
    expect((await run(b, { servidor: configServidor({}) })).body.servidor_configurado).toBe(false);
    expect(b).not.toHaveBeenCalled();
  });

  it("endereço do servidor só por secret https, sem senha/parâmetros", () => {
    expect(configServidor({ url: "http://evo.test", chave: "k" }).ok).toBe(false);
    expect(configServidor({ url: "https://u:p@evo.test", chave: "k" }).ok).toBe(false);
    expect(configServidor({ url: "https://evo.test/?x=1", chave: "k" }).ok).toBe(false);
    expect(configServidor({ url: "nada", chave: "k" }).ok).toBe(false);
    expect(configServidor({ url: "https://evo.test/api/", chave: "k" })).toEqual({ ok: true, base: "https://evo.test/api", chave: "k" });
  });

  it("isolamento: instância derivada da empresa; dados do cliente e instâncias de outras empresas ignorados", async () => {
    expect(nomeInstancia(ORG_A)).not.toBe(nomeInstancia(ORG_B));
    expect(() => nomeInstancia("../outra")).toThrow();
    const b = mock((url) => url.includes("fetchInstances")
      ? [200, [{ name: nomeInstancia(ORG_B), ownerJid: "5575999990000@s.whatsapp.net", connectionStatus: "open", token: "segredo-B" }]]
      : [200, { instance: { state: "open" } }]);
    // corpo malicioso não tem efeito: a função só recebe "acao"
    const r = await run(b, { acao: "estado" });
    expect(r.body).toMatchObject({ existe: false, conectado: false, numero: null });
    expect(JSON.stringify(r.body)).not.toContain("segredo-B");
    for (const [url, init] of b.mock.calls) {
      expect(url.startsWith("https://evo.exemplo.test/instance/")).toBe(true);
      expect(url).toContain(nomeInstancia(ORG_A));
      expect((init.headers as Record<string, string>).apikey).toBe("chave-ficticia");
    }
  });

  it("estado confirmado: só 'open' do servidor vira conectado, com número da sessão", async () => {
    const inst = [{ name: nomeInstancia(ORG_A), ownerJid: "5575988887777@s.whatsapp.net", profileName: "Gás Teste", token: "t" }];
    const aberto = await run(mock((u) => u.includes("fetchInstances") ? [200, inst] : [200, { instance: { state: "open" } }]));
    expect(aberto.body).toMatchObject({ conectado: true, estado: "open", numero: "5575988887777", perfil: "Gás Teste" });
    expect(JSON.stringify(aberto.body)).not.toContain('"token"');
    for (const st of ["connecting", "close"]) {
      const r = await run(mock((u) => u.includes("fetchInstances") ? [200, inst] : [200, { instance: { state: st } }]));
      expect(r.body).toMatchObject({ conectado: false, estado: st, numero: null });
    }
    const falha = await run(mock((u) => u.includes("fetchInstances") ? [200, inst] : [500, {}]));
    expect(falha.body.conectado).toBe(false);
  });

  it("QR real: cria a instância da empresa, devolve a imagem do servidor com validade; já conectado não gera QR", async () => {
    const b = mock((u, i) => u.includes("fetchInstances") ? [200, []] : i.method === "POST" ? [201, {}] : [200, { base64: QR, count: 1 }]);
    const r = await run(b, { acao: "conectar" });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ qr: QR, conectado: false });
    expect(JSON.parse(String(b.mock.calls[1][1].body))).toEqual({ instanceName: nomeInstancia(ORG_A), integration: "WHATSAPP-BAILEYS", qrcode: true });
    expect(Date.parse(String(r.body.expira_em)) - AGORA).toBe(QR_VALIDADE_MS);
    const inst = [{ name: nomeInstancia(ORG_A), ownerJid: "5575988887777@s.whatsapp.net" }];
    const ja = await run(mock((u) => u.includes("fetchInstances") ? [200, inst] : [200, { instance: { state: "open" } }]), { acao: "conectar" });
    expect(ja.body.qr).toBeUndefined();
    expect(ja.body.conectado).toBe(true);
  });

  it("QR ausente/inválido nunca é inventado; QR expirado é reconhecido", async () => {
    const semQr = await run(mock((u, i) => u.includes("fetchInstances") ? [200, []] : i.method === "POST" ? [201, {}] : [200, { base64: "data:image/png;base64,<script>" }]), { acao: "conectar" });
    expect(semQr.status).toBe(502);
    expect(semQr.body.qr).toBeUndefined();
    const fora = await run(mock(() => [503, {}]), { acao: "conectar" });
    expect(fora.status).toBe(502);
    expect(qrExpirado(new Date(AGORA + QR_VALIDADE_MS).toISOString(), AGORA + QR_VALIDADE_MS)).toBe(true);
    expect(qrExpirado(new Date(AGORA + QR_VALIDADE_MS).toISOString(), AGORA + 1000)).toBe(false);
    expect(qrExpirado(null, AGORA)).toBe(true);
  });

  it("envio automático preservado: módulo QR só consulta /instance/*, não envia mensagem nem liga envio", async () => {
    const b = mock((u, i) => u.includes("fetchInstances") ? [200, []] : i.method === "POST" ? [201, {}] : [200, { base64: QR }]);
    const r1 = await run(b, { acao: "conectar" });
    const r2 = await run(b, { acao: "estado" });
    for (const [url] of b.mock.calls) {
      expect(url).not.toMatch(/\/message\/|connector-gateway|graph\.facebook/);
    }
    expect(JSON.stringify([r1.body, r2.body])).not.toContain("envio_ativo");
    expect((await run(b, { acao: "ativar" })).status).toBe(400);
  });
});
