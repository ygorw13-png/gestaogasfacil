# G1 014 — aviso de entrega (send-push) contra o laboratório ISOLADO: a função roda localmente (deno) apontando para o
# gateway 127.0.0.1:58000; o "serviço de push" é um servidor falso em 127.0.0.1 que só registra quem foi chamado.
# Dados e chaves fictícios. Confere: destinatário lido do banco, reatribuição, sem aviso após aceite, permissões, empresa.
import base64, hashlib, hmac, json, os, subprocess, threading, time, uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import requests
ROOT = Path(__file__).resolve().parents[3]
GW = "http://127.0.0.1:58000"; FN = "http://127.0.0.1:8000"; PUSH = "https://127.0.0.1:59600"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
ORG = "0a000000-0000-4000-8000-000000000000"; UA = "a0000000-0000-4000-8000-00000000000b"
E1, E2 = "a0000000-0000-4000-8000-00000000000d", "a0000000-0000-4000-8000-0000000000f2"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
ANON = next(l.split("=", 1)[1].strip() for l in open("/tmp/iso-fe/.env") if l.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
results = []
def rec(n, ok, d=""): results.append({"test": n, "ok": bool(ok), "detail": str(d)[:300]}); print("PASS" if ok else "FAIL", n, str(d)[:200], flush=True)
def q(sql): r = subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV); return r.stdout.strip() or r.stderr.strip()
b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=").decode()
def jwt(claims):
    sec = open("/root/iso/secret").read().strip().encode()
    h = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()); p = b64(json.dumps(claims).encode())
    return f"{h}.{p}." + b64(hmac.new(sec, f"{h}.{p}".encode(), hashlib.sha256).digest())
def token(email): return requests.post(f"{GW}/auth/v1/token?grant_type=password", json={"email": email, "password": PW}, headers={"apikey": ANON}, timeout=10).json()["access_token"]
def rpc(tok, fn, **a):
    return requests.post(f"{GW}/rest/v1/rpc/{fn}", json=a, headers={"apikey": ANON, "Authorization": "Bearer " + tok, "Content-Type": "application/json"}, timeout=15)
def aviso(tok, body): r = requests.post(FN, json=body, headers={"Authorization": "Bearer " + tok}, timeout=30); return r.status_code, r.json()

hits = []
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get("content-length", 0)); self.rfile.read(n)
        hits.append({"path": self.path, "ttl": self.headers.get("TTL"), "urgency": self.headers.get("Urgency"), "enc": self.headers.get("Content-Encoding")})
        self.send_response(410 if self.path == "/velha" else 201); self.end_headers()
    def log_message(self, *a): pass
import ssl
# web-push só fala https: certificado autoassinado local, aceito só pelo processo da função no laboratório.
subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", "/tmp/push014.key", "-out", "/tmp/push014.crt", "-days", "1", "-subj", "/CN=127.0.0.1"], capture_output=True)
srv = HTTPServer(("127.0.0.1", 59600), H); ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain("/tmp/push014.crt", "/tmp/push014.key")
srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
threading.Thread(target=srv.serve_forever, daemon=True).start()

keys = json.loads(subprocess.run(["deno", "eval", "--node-modules-dir=none", """
import webpush from "npm:web-push@3.6.7";
const v = webpush.generateVAPIDKeys();
const subs = [];
for (let i = 0; i < 5; i++) { const k = await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"}, true, ["deriveBits"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", k.publicKey));
  const b = (u) => btoa(String.fromCharCode(...u)).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");
  subs.push({ p256dh: b(raw), auth: b(crypto.getRandomValues(new Uint8Array(16))) }); }
console.log(JSON.stringify({ v, subs }));"""], capture_output=True, text=True, cwd="/tmp").stdout)
s = keys["subs"]
q("GRANT service_role TO authenticator")  # só no laboratório: a função usa a chave de serviço local
q("delete from push_subscriptions")
for i, (uid, path) in enumerate([(E1, "/e1"), (E2, "/e2"), (UA, "/ua"), (E1, "/velha")]):
    q(f"insert into push_subscriptions(user_id, organization_id, endpoint, p256dh, auth) values ('{uid}','{ORG}','{PUSH}{path}','{s[i]['p256dh']}','{s[i]['auth']}')")
fenv = {**ENV, "SUPABASE_URL": GW, "SUPABASE_SERVICE_ROLE_KEY": jwt({"role": "service_role", "iss": "local-lab", "exp": 4102444800}),
        "VAPID_PUBLIC_KEY": keys["v"]["publicKey"], "VAPID_PRIVATE_KEY": keys["v"]["privateKey"], "VAPID_SUBJECT": "mailto:teste@ficticio.test", "NODE_TLS_REJECT_UNAUTHORIZED": "0"}
fn = subprocess.Popen(["deno", "run", "-A", "--node-modules-dir=none", str(ROOT / "supabase/functions/send-push/index.ts")], env=fenv, stdout=open("/tmp/push014_fn.log", "w"), stderr=subprocess.STDOUT, cwd="/tmp")
for _ in range(60):
    try: requests.options(FN, timeout=1); break
    except Exception: time.sleep(1)
try:
    tu, te1, te2, tb = token("user.a@ficticio.test"), token("entregador.a@ficticio.test"), token("entregador2.a@ficticio.test"), token("admin.b@ficticio.test")
    st, r = aviso("x.y.z", {"tipo": "teste"}); rec("P01 sem sessão válida: recusado", st == 401, (st, r))
    st, r = aviso(tu, {"tipo": "qualquer"}); rec("P02 tipo desconhecido: recusado", st == 400, (st, r))
    oid = str(uuid.uuid4())
    rr = requests.post(f"{GW}/rest/v1/orders", json={"id": oid, "user_id": UA, "organization_id": ORG, "client_name": "Cliente Aviso 014", "product": "Gás P13", "quantity": 1,
        "price": 125, "payment_method": "money", "tipo_venda": "recarga", "origem_venda": "pedido", "address": {"street": "Rua Fictícia", "number": "14"}},
        headers={"apikey": ANON, "Authorization": "Bearer " + tu, "Content-Type": "application/json"}, timeout=15)
    assert rr.status_code < 300, rr.text
    hits.clear(); st, r = aviso(tu, {"tipo": "atribuicao", "orderId": oid})
    rec("P03 pedido ainda sem entregador: nenhum aviso", st == 200 and r.get("sent") == 0 and not hits, (st, r, hits))
    a = rpc(tu, "atribuir_entrega", _order_id=oid, _entregador_id=E1, _retirar_da_portaria=True, _chave="k-push014-a-" + oid); assert a.status_code < 300, a.text
    hits.clear(); st, r = aviso(tu, {"tipo": "atribuicao", "orderId": oid}); time.sleep(0.5)
    paths = sorted(h["path"] for h in hits)
    rec("P04 atribuição: aviso só para o entregador do pedido (e inscrição vencida removida)",
        st == 200 and r.get("sent") == 1 and paths == ["/e1", "/velha"] and q(f"select count(*) from push_subscriptions where endpoint='{PUSH}/velha'") == "0", (st, r, paths))
    rec("P05 aviso urgente, cifrado, válido por 30 min", hits and all(h["urgency"] == "high" and h["ttl"] == "1800" and h["enc"] == "aes128gcm" for h in hits), hits[:1])
    hits.clear(); st, r = aviso(te1, {"tipo": "atribuicao", "orderId": oid}); rec("P06 entregador não dispara aviso de atribuição", st == 403 and not hits, (st, r))
    hits.clear(); st, r = aviso(tb, {"tipo": "atribuicao", "orderId": oid}); rec("P07 outra empresa: pedido não encontrado, nenhum aviso", st == 404 and not hits, (st, r))
    rt = rpc(tu, "reatribuir_entrega", _order_id=oid, _novo_entregador_id=E2, _motivo="Teste fictício de troca", _transferir_carga=True, _chave="k-push014-r-" + oid)
    hits.clear(); st, r = aviso(tu, {"tipo": "atribuicao", "orderId": oid}); time.sleep(0.5)
    rec("P08 reatribuição: aviso vai para o novo responsável, não para o anterior", rt.status_code < 300 and r.get("sent") == 1 and [h["path"] for h in hits] == ["/e2"], (rt.status_code, rt.text[:80], r, hits))
    ac = rpc(te2, "entregador_aceitar_entrega", _order_id=oid)
    hits.clear(); st, r = aviso(tu, {"tipo": "atribuicao", "orderId": oid})
    rec("P09 depois do aceite: nenhum aviso (não aguarda mais aceite)", ac.status_code < 300 and r.get("sent") == 0 and not hits, (ac.status_code, r))
    hits.clear(); st, r = aviso(te1, {"tipo": "teste"}); time.sleep(0.5)
    rec("P10 'Testar aviso': só nas inscrições da própria conta", st == 200 and [h["path"] for h in hits] == ["/e1"], (st, r, hits))
    hits.clear(); st, r = aviso(tu, {"tipo": "atribuicao", "orderId": "nao-e-uuid"}); rec("P11 pedido inválido: recusado", st == 400 and not hits, (st, r))
finally:
    fn.terminate()
print(f"\npush014: {sum(r['ok'] for r in results)}/{len(results)}")
(Path(__file__).parent / "results_push014.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))
