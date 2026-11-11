# G1 010 — fluxos essenciais no navegador contra backend ISOLADO (PostgreSQL + PostgREST + gateway locais, 127.0.0.1)
# com a sequência consolidada 001–010 e o app construído com VITE_G1_ACOES=on. Dados fictícios.
# Cobre: abertura e saldo, venda de balcão (com resposta perdida e reenvio), venda a prazo, saída para a carga,
# atribuição pela carga, aceite e conclusão pelo entregador, recebimento parcial (com resposta perdida e reenvio),
# cancelamento de venda concluída recusado. Recusa rodar se o app não apontar para o servidor local.
import asyncio, json, os, re, subprocess
from pathlib import Path
import requests
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots_010"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; GW = "http://127.0.0.1:58000"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
ORG = "0a000000-0000-4000-8000-000000000000"
ENT, OPER = "a0000000-0000-4000-8000-00000000000d", "a0000000-0000-4000-8000-00000000000b"
OE = "0d000000-0000-4000-8000-000000010e01"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
ANON = next(l.split("=", 1)[1].strip() for l in open("/tmp/iso-fe/.env") if l.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
assert "127.0.0.1:58000" in open("/tmp/iso-fe/.env").read(), "cópia isolada não aponta para o gateway local"
assert "VITE_G1_ACOES=on" in open("/tmp/iso-fe/.env").read()
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": str(detail)[:400]}); print("PASS" if ok else "FAIL", name, str(detail)[:260], flush=True)
def q(sql):
    return subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV).stdout.strip()
def saldo(prod="P13"):
    return q(f"select coalesce(sum(delta_cheios),0)||'/'||coalesce(sum(delta_vazios),0) from movimentacoes_portaria where organization_id='{ORG}' and produto='{prod}' and data_operacao=data_operacional()")
def carga(prod="P13"):
    return q(f"select coalesce(sum(m.delta_cheios),0) from carga_movimentos m join cargas c on c.id=m.carga_id where c.entregador_id='{ENT}' and c.status='aberta' and m.produto='{prod}'")
def sessao(email):
    r = requests.post(f"{GW}/auth/v1/token?grant_type=password", json={"email": email, "password": PW}, headers={"apikey": ANON}, timeout=10)
    return {"apikey": ANON, "Authorization": "Bearer " + r.json()["access_token"], "Content-Type": "application/json"}
async def login(page, email):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click()
    await page.wait_for_timeout(4500)
async def toasts(page):
    return " | ".join(await page.locator("[data-sonner-toast], li[role='status'], [role='status'], [role='alert']").all_inner_texts())
async def perder(page, rota, guarda):
    async def h(route):
        resp = await route.fetch(); guarda.append(resp.status); await route.abort("failed")
    await page.route(rota, h)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        prod_hits = []
        def guard(pg): pg.on("request", lambda r: ("supabase.co" in r.url or "lovable.app" in r.url) and prod_hits.append(r.url))
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); guard(pg)
        await login(pg, "user.a@ficticio.test")

        # ── E01 Abertura do dia pela portaria ──
        await pg.goto(BASE + "/entrance", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        dlg = pg.get_by_role("dialog", name=re.compile("Abertura do dia"))
        if not await dlg.is_visible():
            await pg.get_by_role("button", name=re.compile("abertura", re.I)).first.click(); await pg.wait_for_timeout(1000)
        nums = dlg.locator('input[type="number"]')
        await nums.nth(0).fill("10"); await nums.nth(1).fill("5")
        await pg.screenshot(path=str(S / "e01_abertura.png"))
        await dlg.get_by_role("button", name="Confirmar abertura").click(); await pg.wait_for_timeout(2500)
        rec("E01 abertura pela tela registra o saldo do dia (P13 10 cheios / 5 vazios)", saldo() == "10/5" and not await dlg.is_visible(), f"saldo={saldo()}")

        # ── E02 Venda de balcão: resposta perdida depois de gravar, reenvio sem duplicar ──
        await pg.goto(BASE + "/orders", wait_until="networkidle"); await pg.wait_for_timeout(2000)
        await pg.get_by_role("button", name=re.compile("Venda Rápida")).first.click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("#qs-client").fill("Cliente Balcão 010"); await dlg.locator("#qs-price").fill("120")
        perdidas = []; await perder(pg, "**/rest/v1/rpc/venda_portaria", perdidas)
        await dlg.get_by_role("button", name=re.compile("Registrar")).click(); await pg.wait_for_timeout(3000)
        aberto = await dlg.is_visible(); gravado = q("select count(*) from orders where client_name='Cliente Balcão 010'")
        rec("E02a venda gravada com resposta perdida: tela mantém o formulário aberto", perdidas == [200] and aberto and gravado == "1", f"perdidas={perdidas} aberto={aberto} gravado={gravado}")
        await pg.screenshot(path=str(S / "e02_resposta_perdida.png"))
        await pg.unroute("**/rest/v1/rpc/venda_portaria")
        await dlg.get_by_role("button", name=re.compile("Registrar")).click(); await pg.wait_for_timeout(3000)
        r = q("select (select count(*) from orders where client_name='Cliente Balcão 010')||'/'||(select count(*) from recebimentos r join orders o on o.id=r.order_id where o.client_name='Cliente Balcão 010' and r.destino='caixa' and r.valor=120)||'/'||(select count(*) from movimentacoes_portaria m join orders o on o.id=m.referencia_id where o.client_name='Cliente Balcão 010')")
        rec("E02b reenvio: 1 venda, 1 recebimento no caixa, 1 baixa; saldo P13 9/6", r == "1/1/1" and saldo() == "9/6" and not await dlg.is_visible(), f"venda/receb/baixa={r} saldo={saldo()}")

        # ── E03 Venda a prazo: gera promissória, nenhum dinheiro recebido ──
        await pg.get_by_role("button", name=re.compile("Venda Rápida")).first.click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("#qs-client").fill("Cliente Prazo 010"); await dlg.locator("#qs-price").fill("250")
        await dlg.get_by_role("combobox").filter(has_text="Dinheiro").click(); await pg.get_by_role("option", name="Nota Promissória").click()
        await dlg.get_by_role("button", name=re.compile("Registrar")).click(); await pg.wait_for_timeout(3000)
        r = q("select (select count(*) from orders where client_name='Cliente Prazo 010' and price=250)||'/'||(select count(*) from promissory_notes n join orders o on o.id=n.order_id where o.client_name='Cliente Prazo 010' and n.value=250 and n.status='pending')||'/'||(select count(*) from recebimentos r join orders o on o.id=r.order_id where o.client_name='Cliente Prazo 010')")
        rec("E03 venda a prazo: 1 venda de 250, 1 promissória pendente, 0 recebimento; saldo P13 8/7", r == "1/1/0" and saldo() == "8/7", f"venda/prom/receb={r} saldo={saldo()}")

        # ── E04 Saída da portaria para a carga do entregador ──
        await pg.goto(BASE + "/entrance/cargas", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        await pg.get_by_role("button", name=re.compile("Saída para a carga")).click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.get_by_role("combobox").first.click(); await pg.get_by_role("option", name="Entregador A").click()
        await dlg.locator("#saida-qtd").fill("3"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=str(S / "e04_saida_carga.png"))
        await dlg.get_by_role("button", name="Transferir").click(); await pg.wait_for_timeout(3000)
        rec("E04 transferência: carga do entregador 3, portaria P13 5/7 (sem venda)", carga() == "3" and saldo() == "5/7" and not await dlg.is_visible(), f"carga={carga()} saldo={saldo()} {await toasts(pg)}"[:300])

        # ── E05 Atribuição pela carga (portaria não baixa de novo) ──
        await pg.goto(BASE + "/orders", wait_until="networkidle"); await pg.wait_for_timeout(2000)
        row = pg.locator("tr", has_text="Cliente Entrega 010")
        await row.get_by_role("button", name=re.compile("Atribuir")).click(); await pg.wait_for_timeout(1200)
        await pg.locator("#deliveryPerson").click(); await pg.get_by_role("option", name="Entregador A").click(); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=str(S / "e05_atribuicao.png"))
        await pg.get_by_role("dialog").get_by_role("button", name="Confirmar", exact=True).click(); await pg.wait_for_timeout(2500)
        r = q(f"select delivery_person_id||'/'||status from orders where id='{OE}'")
        rec("E05 pedido atribuído ao entregador pelo ID; portaria e carga inalteradas", r.startswith(ENT) and saldo() == "5/7" and carga() == "3", f"{r} saldo={saldo()} carga={carga()}")

        # ── E06 Entregador aceita e conclui ──
        c2 = await b.new_context(viewport={"width": 430, "height": 1400}); pe = await c2.new_page(); guard(pe)
        await login(pe, "entregador.a@ficticio.test")
        await pe.goto(BASE + "/entregador/entregas", wait_until="networkidle"); await pe.wait_for_timeout(2500)
        card = pe.locator("div.rounded-lg, [class*=card]", has_text="Cliente Entrega 010").first
        await pe.get_by_role("button", name=re.compile("Aceitar")).first.click(); await pe.wait_for_timeout(2500)
        await pe.get_by_role("button", name=re.compile("Entreguei")).first.click(); await pe.wait_for_timeout(1000)
        await pe.get_by_role("dialog").get_by_role("button", name="Confirmar", exact=True).click(); await pe.wait_for_timeout(3000)
        await pe.screenshot(path=str(S / "e06_entregue.png"))
        r = q(f"select status||'/'||(select count(*) from recebimentos where order_id='{OE}' and destino='entregador' and valor=125 and responsavel_id='{ENT}') from orders where id='{OE}'")
        rec("E06 conclusão: carga 3→2, dinheiro com o entregador (1 recebimento), portaria inalterada", r.split("/")[1] == "1" and carga() == "2" and saldo() == "5/7", f"status/receb={r} carga={carga()} saldo={saldo()} {await toasts(pe)}"[:300])

        # ── E07 Recebimento parcial da promissória: resposta perdida, reenvio sem duplicar ──
        await pg.goto(BASE + "/promissory", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        await pg.locator("tr", has_text="Cliente Prazo 010").first.click(); await pg.wait_for_timeout(1000)
        await pg.get_by_role("dialog").get_by_role("button", name=re.compile("Pagamento")).first.click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog", name=re.compile("Registrar recebimento"))
        await dlg.locator("#value").fill("100")
        await dlg.locator("#method").click(); await pg.get_by_role("option", name="Dinheiro").click()
        perdidas = []; await perder(pg, "**/rest/v1/rpc/receber_promissoria", perdidas)
        await dlg.get_by_role("button", name="Confirmar").click(); await pg.wait_for_timeout(3000)
        aberto = await dlg.is_visible()
        await pg.screenshot(path=str(S / "e07_resposta_perdida.png"))
        await pg.unroute("**/rest/v1/rpc/receber_promissoria")
        await dlg.get_by_role("button", name="Confirmar").click(); await pg.wait_for_timeout(3000)
        r = q("select n.paid_amount||'/'||n.status||'/'||(select count(*) from recebimentos r where r.promissory_id=n.id) from promissory_notes n join orders o on o.id=n.order_id where o.client_name='Cliente Prazo 010'")
        rec("E07 recebimento parcial 100 de 250 com reenvio: 1 recebimento só, saldo 150 em aberto", perdidas == [200] and aberto and r.split("/")[0] in ("100", "100.00") and r.endswith("/1") and r.split("/")[1] != "paid", f"perdidas={perdidas} aberto={aberto} pago/status/receb={r}")
        await pg.screenshot(path=str(S / "e07_parcial.png"))

        # ── E08 Cancelamento de venda concluída continua recusado (admin, sessão real local) ──
        h = sessao("admin.a@ficticio.test"); venda = q("select id from orders where client_name='Cliente Balcão 010'")
        antes = q(f"select status||'/'||(select count(*) from recebimentos where order_id='{venda}')||'/'||(select count(*) from movimentacoes_portaria where referencia_id='{venda}') from orders where id='{venda}'")
        rr = requests.post(f"{GW}/rest/v1/rpc/admin_corrigir_pedido", headers=h, json={"_order_id": venda, "_novo_preco": None, "_novo_status": "cancelled", "_motivo": "teste fictício"}, timeout=10)
        depois = q(f"select status||'/'||(select count(*) from recebimentos where order_id='{venda}')||'/'||(select count(*) from movimentacoes_portaria where referencia_id='{venda}') from orders where id='{venda}'")
        rec("E08 cancelar venda concluída (admin) é recusado e nada muda", rr.status_code >= 400 and antes == depois, f"http={rr.status_code} {rr.text[:120]} antes={antes} depois={depois}")

        rec("E09 nenhuma requisição saiu para o backend real", not prod_hits, prod_hits[:3])
        await b.close()
    ok = sum(r["ok"] for r in results)
    print(f"\n010 navegador: {ok}/{len(results)}")
    (D / "results_010.json").write_text(json.dumps({"total": len(results), "ok": ok, "results": results}, ensure_ascii=False, indent=1))
asyncio.run(main())
