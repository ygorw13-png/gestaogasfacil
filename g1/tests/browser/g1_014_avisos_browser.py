# G1 014 — app do entregador no navegador contra backend ISOLADO: painel de avisos, abrir pedido pelo aviso (?pedido=),
# lembrete de aceite que confere o servidor antes de tocar e para depois do aceite, e os dois service workers
# (cópia offline em "/" e avisos em "/push/") convivendo. Só dados fictícios.
import asyncio, json, os, re, subprocess, uuid
from pathlib import Path
import requests
from playwright.async_api import async_playwright
D = Path(__file__).parent; S = D / "shots_014"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; GW = "http://127.0.0.1:58000"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
ORG = "0a000000-0000-4000-8000-000000000000"; UA = "a0000000-0000-4000-8000-00000000000b"; E1 = "a0000000-0000-4000-8000-00000000000d"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
ANON = next(l.split("=", 1)[1].strip() for l in open("/tmp/iso-fe/.env") if l.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
assert "127.0.0.1:58000" in open("/tmp/iso-fe/.env").read()
results = []
def rec(n, ok, d=""): results.append({"test": n, "ok": bool(ok), "detail": str(d)[:300]}); print("PASS" if ok else "FAIL", n, str(d)[:220], flush=True)
def q(sql): r = subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV); return r.stdout.strip() or r.stderr.strip()
def token(email): return requests.post(f"{GW}/auth/v1/token?grant_type=password", json={"email": email, "password": PW}, headers={"apikey": ANON}, timeout=10).json()["access_token"]
def rpc(tok, fn, **a): return requests.post(f"{GW}/rest/v1/rpc/{fn}", json=a, headers={"apikey": ANON, "Authorization": "Bearer " + tok, "Content-Type": "application/json"}, timeout=15)
def pedido(tu, nome):
    i = str(uuid.uuid4())
    r = requests.post(f"{GW}/rest/v1/orders", json={"id": i, "user_id": UA, "organization_id": ORG, "client_name": nome, "product": "Gás P13", "quantity": 1, "price": 125,
        "payment_method": "money", "tipo_venda": "recarga", "origem_venda": "pedido", "address": {"street": "Rua Fictícia", "number": "1"}},
        headers={"apikey": ANON, "Authorization": "Bearer " + tu, "Content-Type": "application/json"}, timeout=15); assert r.status_code < 300, r.text
    a = rpc(tu, "atribuir_entrega", _order_id=i, _entregador_id=E1, _retirar_da_portaria=True, _chave="k-av014-" + i); assert a.status_code < 300, a.text
    return i
async def login(page, email):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(email); await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click(); await page.wait_for_timeout(4500)

async def main():
    tu, te = token("user.a@ficticio.test"), token("entregador.a@ficticio.test")
    A = pedido(tu, "Cliente Lembrete 014"); B = pedido(tu, "Cliente Aviso Aberto 014")
    # pedido A atribuído há 6 min (só no banco fictício): deve gerar lembrete de aceite
    q(f"set session_replication_role=replica; update orders set assigned_at=now()-interval '6 minutes', created_at=now()-interval '6 minutes' where id='{A}'")
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True); prod = []
        c = await b.new_context(viewport={"width": 390, "height": 844}); pg = await c.new_page()
        pg.on("request", lambda r: ("supabase.co" in r.url or "lovable.app" in r.url) and prod.append(r.url))
        await login(pg, "entregador.a@ficticio.test")
        await pg.goto(BASE + f"/entregador/entregas?pedido={B}", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        await pg.evaluate("""() => { window.__lembretes = 0; new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
            if (n.textContent && n.textContent.includes('Aceite a entrega')) window.__lembretes++; }))).observe(document.body, { childList: true, subtree: true }); }""")
        corpo = await pg.locator("main").inner_text()
        rec("V01 painel de avisos com 'Ativar notificações' e aviso sobre silencioso/Não perturbe",
            await pg.get_by_role("button", name=re.compile("Ativar notificações")).count() == 1 and "Não perturbe" in corpo, corpo[:160])
        card = pg.locator(f"#pedido-{B}")
        cls = await card.get_attribute("class") or ""
        box = await card.bounding_box()
        rec("V02 aberto pelo aviso (?pedido=): pedido destacado e visível na tela", "ring-4" in cls and box and 0 <= box["y"] < 844, (cls[-40:], box))
        await pg.screenshot(path=str(S / "v02_pedido_aberto_pelo_aviso.png"))
        await pg.wait_for_timeout(32000)
        n1 = await pg.evaluate("window.__lembretes")
        rec("V03 pedido sem aceite há mais de 5 min: lembrete aparece", n1 >= 1, n1)
        await pg.screenshot(path=str(S / "v03_lembrete.png"))
        ac = rpc(te, "entregador_aceitar_entrega", _order_id=A); ac2 = rpc(te, "entregador_aceitar_entrega", _order_id=B)
        await pg.wait_for_timeout(1000); n2 = await pg.evaluate("window.__lembretes")
        await pg.wait_for_timeout(45000); n3 = await pg.evaluate("window.__lembretes")
        rec("V04 aceite feito em outro lugar: lembrete para (o app confere no servidor antes de tocar)", ac.status_code < 300 and n3 == n2, (ac.status_code, n2, n3))
        regs = await pg.evaluate("""async () => { await navigator.serviceWorker.register('/push-sw.js', { scope: '/push/' });
            await new Promise((r) => setTimeout(r, 1500)); return (await navigator.serviceWorker.getRegistrations()).map((r) => new URL(r.scope).pathname).sort(); }""")
        rec("V05 cópia offline ('/') e avisos ('/push/') registrados lado a lado, sem se substituírem", "/push/" in regs and "/" in regs, regs)
        await c.close()
        c = await b.new_context(viewport={"width": 390, "height": 844}); pg = await c.new_page()
        await login(pg, "entregador.a@ficticio.test")
        await pg.evaluate("() => { Object.defineProperty(Notification, 'permission', { get: () => 'denied' }); }")
        await pg.add_init_script("Object.defineProperty(Notification, 'permission', { get: () => 'denied' });")
        await pg.goto(BASE + "/entregador/entregas", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        corpo = await pg.locator("main").inner_text()
        rec("V06 permissão negada: mensagem clara de como liberar", "Notificações bloqueadas" in corpo, corpo[:160])
        await pg.screenshot(path=str(S / "v06_permissao_negada.png"))
        await c.close()
        rec("V07 nenhuma chamada saiu para o backend real", not prod, prod[:3])
        await b.close()
    print(f"\n014 avisos navegador: {sum(r['ok'] for r in results)}/{len(results)}")
    (D / "results_014_avisos.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))
asyncio.run(main())
