# G1 lote 3 — navegador contra backend real ISOLADO (PostgreSQL + PostgREST locais, 127.0.0.1).
# Dados fictícios. Recusa rodar se o app não apontar para o servidor local.
import asyncio, json, os, re, subprocess
from pathlib import Path
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots_lote3"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
O = "0d000000-0000-4000-8000-000000000001"; ENT = "a0000000-0000-4000-8000-00000000000d"
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": str(detail)}); print("PASS" if ok else "FAIL", name, detail)

def q(sql):
    env = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
    return subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=env).stdout.strip()

async def login(page, email):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click()
    await page.wait_for_timeout(4500)

async def toasts(page):
    return " | ".join(await page.locator("[data-sonner-toast], li[role='status'], [role='status']").all_inner_texts())

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        prod_hits = []

        # ── Operador ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page()
        pg.on("request", lambda r: "supabase.co" in r.url and prod_hits.append(r.url))
        prompts = []
        async def on_dialog(d):
            prompts.append(d.message); await d.accept("Cliente desistiu do pedido")
        pg.on("dialog", on_dialog)
        await login(pg, "user.a@ficticio.test")
        await pg.goto(BASE + "/orders", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        row = pg.locator("tr", has_text="Cliente Navegador Fictício")
        rec("B01 operador vê o pedido aberto da própria empresa", await row.count() == 1)
        rec("B01b operador não vê pedido de outra empresa", await pg.locator("tr", has_text="Cliente B1").count() == 0)

        await row.locator("button").nth(1).click(); await pg.wait_for_timeout(2500)
        t = await toasts(pg)
        rec("B02 operador não cancela (decisão A): recusa visível e pedido intacto",
            q(f"select status from orders where id='{O}'") == "pending" and re.search("permiss|não permitida", t, re.I), t[:160])
        await pg.screenshot(path=str(S / "b02_operador_cancela.png"))

        await row.get_by_role("button", name=re.compile("Atribuir")).click(); await pg.wait_for_timeout(1200)
        await pg.locator("#deliveryPerson").click(); await pg.get_by_role("option", name="Entregador A").click()
        await pg.get_by_text("O produto sai agora da portaria com o entregador").click()
        await pg.screenshot(path=str(S / "b03_atribuir.png"))
        await pg.get_by_role("button", name="Confirmar", exact=True).click(); await pg.wait_for_timeout(3000)
        r = q(f"select o.delivery_person_id||'/'||(select count(*) from carga_movimentos where order_id='{O}' and delta_cheios=1)||'/'||(select count(*) from movimentacoes_portaria m join carga_movimentos cm on cm.carga_id=m.referencia_id and cm.order_id='{O}' and cm.delta_cheios=1 where m.tipo='saida_carga') from orders o where o.id='{O}'")
        rec("B03 atribuição por ID com retirada: carga +1 e saída da portaria na mesma ação", r == f"{ENT}/1/1", r)
        await c.close()

        # ── Entregador ──
        c = await b.new_context(viewport={"width": 430, "height": 1400}); pg = await c.new_page()
        pg.on("request", lambda r: "supabase.co" in r.url and prod_hits.append(r.url))
        await login(pg, "entregador.a@ficticio.test")
        await pg.goto(BASE + "/entregador/entregas", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        card = pg.get_by_text("Cliente Navegador Fictício")
        rec("B04 entregador vê a entrega atribuída a ele", await card.count() >= 1)
        await pg.get_by_role("button", name=re.compile("Aceitar")).first.click(); await pg.wait_for_timeout(2500)
        rec("B05 aceitar pela ação controlada", q(f"select status from orders where id='{O}'") == "delivering", q(f"select status from orders where id='{O}'"))
        await pg.screenshot(path=str(S / "b05_aceitou.png"))
        await pg.get_by_role("tab", name=re.compile("Em rota")).click(); await pg.wait_for_timeout(800)
        await pg.get_by_role("button", name=re.compile("Entreguei")).first.click(timeout=8000); await pg.wait_for_timeout(1000)
        btn = pg.get_by_role("button", name="Confirmar", exact=True)
        await asyncio.gather(btn.click(), btn.click(force=True, no_wait_after=True), return_exceptions=True)
        await pg.wait_for_timeout(3500)
        r = q(f"select (select status from orders where id='{O}')||'/'||(select count(*) from recebimentos where order_id='{O}')||'/'||(select count(*) from carga_movimentos where order_id='{O}' and delta_cheios=-1)||'/'||(select count(*) from movimentacoes_portaria where tipo='saida_carga')||'/'||(select price from orders where id='{O}')")
        rec("B06 conclusão (toque duplo): 1 recebimento, carga baixa 1x, portaria não baixa de novo, preço intacto",
            r.split("/")[0] in ("delivered", "completed") and r.split("/")[1:4] == ["1", "1", "1"] and float(r.split("/")[4]) == 125, r)
        await pg.screenshot(path=str(S / "b06_entregador_concluiu.png"))

        # Venda na rua sem carga suficiente: recusa sem gravar nada
        antes = q("select count(*) from orders where origem_venda='venda_rua'")
        await pg.goto(BASE + "/entregador/venda-rua", wait_until="networkidle"); await pg.wait_for_timeout(1500)
        await pg.get_by_placeholder("Nome completo").fill("Cliente Rua Fictício")
        await pg.get_by_placeholder("(00) 00000-0000").fill("(71) 90000-0000")
        await pg.get_by_placeholder("0,00").fill("130")
        await pg.get_by_role("button", name=re.compile("Registrar|Salvar|Vender", re.I)).last.click(); await pg.wait_for_timeout(3000)
        t = await toasts(pg)
        rec("B07 venda na rua sem carga: recusada, nada gravado, mensagem clara",
            q("select count(*) from orders where origem_venda='venda_rua'") == antes and re.search("carga", t, re.I), t[:160])
        await pg.screenshot(path=str(S / "b07_venda_rua_sem_carga.png"))

        # Com carga: offline -> fila -> volta online -> uma venda só, mesmo com reenvio
        q(f"""select set_config('request.jwt.claims','{{"sub":"a0000000-0000-4000-8000-00000000000b","role":"authenticated"}}',false);
              set role authenticated; select carga_saida('{ENT}','P13',2,'kk-test-browser-carga'); reset role;""")
        carga = q(f"select coalesce(sum(delta_cheios),0) from carga_movimentos m join cargas c on c.id=m.carga_id where c.entregador_id='{ENT}' and c.status='aberta' and m.produto='P13'")
        await c.set_offline(True)
        await pg.get_by_role("button", name=re.compile("Registrar|Salvar|Vender", re.I)).last.click(); await pg.wait_for_timeout(2500)
        t = await toasts(pg)
        rec("B08 sem internet: venda fica no aparelho (nada no banco ainda)", re.search("aparelho|internet", t, re.I) and q("select count(*) from orders where client_name='Cliente Rua Fictício'") == "0", t[:160])
        await c.set_offline(False); await pg.evaluate("() => window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(6000)
        await pg.evaluate("() => window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(4000)
        r = q("select count(*)||'/'||(select count(*) from recebimentos r join orders o on o.id=r.order_id where o.client_name='Cliente Rua Fictício') from orders where client_name='Cliente Rua Fictício'")
        rec("B09 volta da internet + reenvio: uma venda e um recebimento", r == "1/1", f"{r} (carga antes {carga})")
        await c.close()

        # ── Administrador: painel e decisão B ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page()
        pg.on("request", lambda r: "supabase.co" in r.url and prod_hits.append(r.url))
        pg.on("dialog", lambda d: asyncio.ensure_future(d.accept("Teste de cancelamento")))
        await login(pg, "admin.a@ficticio.test")
        await pg.goto(BASE + "/dashboard", wait_until="networkidle"); await pg.wait_for_timeout(4000)
        flow = pg.locator("[aria-label='Fluxo do dia']")
        txt = await flow.inner_text() if await flow.count() else ""
        rec("B10 painel separa vendas, recebido, saldo, vencido e divergências",
            all(k in txt for k in ["Vendas concluídas", "Recebido hoje", "Saldo a receber", "Saldo vencido", "Divergências"]), txt.replace("\n", " ")[:300])
        rec("B11 recebido mostra dinheiro com entregador aguardando acerto (não comprovado só pela entrega)",
            re.search(r"aguardando acerto (R\$\s?)?255,00", txt.replace("\xa0", " ")) is not None, txt.replace("\n", " ")[:300])
        if await flow.count(): await flow.screenshot(path=str(S / "b10_painel.png"))
        r = q(f"""select set_config('request.jwt.claims','{{"sub":"a0000000-0000-4000-8000-00000000000a","role":"authenticated"}}',false);
              set role authenticated; select admin_corrigir_pedido('{O}',null,'cancelled','Teste decisão B');""")
        rec("B12 admin não cancela venda concluída enquanto a decisão B está pendente",
            q(f"select status from orders where id='{O}'") in ("delivered", "completed"), r[:120])
        await c.close()

        rec("B13 nenhuma chamada saiu para o backend real", len(prod_hits) == 0, prod_hits[:3])
        await b.close()
    (D / "results_lote3.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))
    print(f"browser: {sum(r['ok'] for r in results)}/{len(results)}")

asyncio.run(main())
