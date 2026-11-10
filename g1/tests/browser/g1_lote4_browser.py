# G1 lote 4 — navegador contra backend real ISOLADO (PostgreSQL + PostgREST + gateway locais, 127.0.0.1) com 002+003+004+005.
# Dados fictícios. Cobre: falha e reenvio da venda rápida, cancelamento de venda concluída pela tela (decisão B),
# atribuição concorrente, fila offline antiga com gravação direta, gravação direta pela API com sessão real,
# contenção (app do entregador pausado) e o painel. Recusa rodar se o app não apontar para o servidor local.
import asyncio, json, os, re, subprocess
from pathlib import Path
import requests
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots_lote4"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; GW = "http://127.0.0.1:58000"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
SQLDIR = D.parent.parent / "candidate" / "sql"
ORG = "0a000000-0000-4000-8000-000000000000"
ENT, ENT2, OPER = "a0000000-0000-4000-8000-00000000000d", "a0000000-0000-4000-8000-00000000000f", "a0000000-0000-4000-8000-00000000000b"
OC, OF, OK = "0d000000-0000-4000-8000-0000000004c1", "0d000000-0000-4000-8000-0000000004f1", "0d000000-0000-4000-8000-0000000004e1"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
ANON = next(l.split("=", 1)[1].strip() for l in open("/tmp/iso-fe/.env") if l.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
assert "127.0.0.1:58000" in open("/tmp/iso-fe/.env").read(), "cópia isolada não aponta para o gateway local"
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": str(detail)[:400]}); print("PASS" if ok else "FAIL", name, str(detail)[:220])
def q(sql):
    return subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV).stdout.strip()
def como(uid, sql):
    return q(f"""select set_config('request.jwt.claims','{{"sub":"{uid}","role":"authenticated"}}',false); set role authenticated; {sql}; reset role;""")
def arquivo(nome):
    p = subprocess.run(["psql", DB, "-XAq", "-1", "-v", "ON_ERROR_STOP=1", "-f", str(SQLDIR / nome)], capture_output=True, text=True, env=ENV)
    assert p.returncode == 0, p.stderr[:300]
def sessao(email):
    r = requests.post(f"{GW}/auth/v1/token?grant_type=password", json={"email": email, "password": PW}, headers={"apikey": ANON}, timeout=10)
    return {"apikey": ANON, "Authorization": "Bearer " + r.json()["access_token"], "Content-Type": "application/json", "Prefer": "return=representation"}

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
        def ctx_guard(pg): pg.on("request", lambda r: "supabase.co" in r.url and prod_hits.append(r.url))

        # ── L01–L02 Venda rápida: resposta perdida depois de gravar, reenvio com a mesma chave ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); ctx_guard(pg)
        await login(pg, "user.a@ficticio.test")
        await pg.goto(BASE + "/orders", wait_until="networkidle"); await pg.wait_for_timeout(2000)
        base = q("select (select count(*) from orders where client_name='Cliente Balcão Lote4')||'/'||(select count(*) from recebimentos)||'/'||(select count(*) from movimentacoes_portaria where tipo='venda')")
        await pg.get_by_role("button", name=re.compile("Venda Rápida")).first.click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("#qs-client").fill("Cliente Balcão Lote4")
        await dlg.locator("#qs-price").fill("120")
        perdidas = []
        async def perde_resposta(route):
            resp = await route.fetch(); perdidas.append(resp.status); await route.abort("failed")
        await pg.route("**/rest/v1/rpc/venda_portaria", perde_resposta)
        await dlg.get_by_role("button", name=re.compile("Registrar")).click(); await pg.wait_for_timeout(3000)
        t = await toasts(pg); aberto = await dlg.is_visible()
        gravado = q("select count(*) from orders where client_name='Cliente Balcão Lote4'")
        rec("L01 servidor gravou mas a resposta se perdeu: tela avisa erro e o formulário continua aberto",
            perdidas == [200] and aberto and re.search("Erro", t) and gravado == "1", f"perdidas={perdidas} aberto={aberto} gravado={gravado} {t[:120]}")
        await pg.screenshot(path=str(S / "l01_resposta_perdida.png"))
        await pg.unroute("**/rest/v1/rpc/venda_portaria")
        await dlg.get_by_role("button", name=re.compile("Registrar")).click(); await pg.wait_for_timeout(3000)
        depois = q("select (select count(*) from orders where client_name='Cliente Balcão Lote4')||'/'||(select count(*) from recebimentos)||'/'||(select count(*) from movimentacoes_portaria where tipo='venda')")
        b0 = [int(x) for x in base.split("/")]; d0 = [int(x) for x in depois.split("/")]
        rec("L02 reenvio pela tela: uma venda, um recebimento e uma baixa da portaria (sem duplicar)",
            d0 == [1, b0[1] + 1, b0[2] + 1] and not await dlg.is_visible(), f"antes {base} depois {depois}")
        VENDA = q("select id from orders where client_name='Cliente Balcão Lote4'")

        # ── L03 Atribuição concorrente do mesmo pedido em duas telas ──
        c2 = await b.new_context(viewport={"width": 1280, "height": 1800}); pg2 = await c2.new_page(); ctx_guard(pg2)
        await login(pg2, "user.a@ficticio.test")
        saidas0 = int(q("select count(*) from movimentacoes_portaria where tipo='saida_carga'"))
        for page, nome in ((pg, "Entregador A"), (pg2, "Entregador Dois A")):
            await page.goto(BASE + "/orders", wait_until="networkidle"); await page.wait_for_timeout(2000)
            row = page.locator("tr", has_text="Cliente Concorrência Fictício")
            await row.get_by_role("button", name=re.compile("Atribuir")).click(); await page.wait_for_timeout(1200)
            await page.locator("#deliveryPerson").click(); await page.get_by_role("option", name=nome).click()
            await page.get_by_text("O produto sai agora da portaria com o entregador").click()
        await asyncio.gather(pg.get_by_role("button", name="Confirmar", exact=True).click(),
                             pg2.get_by_role("button", name="Confirmar", exact=True).click())
        await pg.wait_for_timeout(1800)
        t1, t2 = await toasts(pg), await toasts(pg2)
        r = q(f"select delivery_person_id||'/'||(select count(*) from carga_movimentos where order_id='{OC}' and delta_cheios=1) from orders where id='{OC}'")
        saidas1 = int(q("select count(*) from movimentacoes_portaria where tipo='saida_carga'"))
        dono = r.split("/")[0]
        rec("L03 duas telas atribuem ao mesmo tempo: um entregador só, produto sai da portaria uma vez",
            dono in (ENT, ENT2) and r.split("/")[1] == "1" and saidas1 - saidas0 == 1, f"{r} saídas +{saidas1 - saidas0}")
        ganhou, perdeu = (t1, t2) if dono == ENT else (t2, t1)
        rec("L03b a tela que perdeu a disputa avisa o erro e não diz que atribuiu",
            "Pedido atribuído" in ganhou and "Erro ao atribuir" in perdeu and "Pedido atribuído" not in perdeu, f"ganhou: {ganhou[:80]} || perdeu: {perdeu[:140]}")
        await pg2.screenshot(path=str(S / "l03_concorrencia_tela2.png")); await c2.close()

        # ── L04 Fila offline antiga com gravação direta: não é enviada nem com a volta da internet ──
        legado = [
            {"id": "legado-l4-1", "target": "orders", "action": "update", "payload": {"status": "delivered", "payment_method": "money"},
             "match": {"id": OF}, "description": "Entrega concluída (fila antiga, gravação direta)", "createdAt": 1700000000000, "attempts": 0},
            {"id": "legado-l4-2", "target": "promissory_notes", "action": "insert",
             "payload": {"organization_id": ORG, "client_name": "Cliente Fila Antiga Fictício", "value": 125, "paid_amount": 125, "status": "paid", "due_date": "2026-01-01"},
             "description": "Promissória quitada (fila antiga, gravação direta)", "createdAt": 1700000000000, "attempts": 0}]
        diretas = []
        pg.on("request", lambda r: r.method in ("POST", "PATCH", "DELETE") and re.search(r"/rest/v1/(orders|promissory_notes)\b", r.url) and diretas.append(r.method + " " + r.url))
        await pg.evaluate("""(itens) => new Promise((ok, erro) => { const req = indexedDB.open('gasfacil-offline', 1);
            req.onsuccess = () => { const tx = req.result.transaction('queue', 'readwrite'); itens.forEach(i => tx.objectStore('queue').put(i));
              tx.oncomplete = () => ok(true); tx.onerror = () => erro(tx.error); }; req.onerror = () => erro(req.error); })""", legado)
        await pg.evaluate("() => window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(5000)
        await pg.goto(BASE + "/offline", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        txt = await pg.locator("body").inner_text()
        r = q(f"select (select status from orders where id='{OF}')||'/'||(select count(*) from promissory_notes where client_name='Cliente Fila Antiga Fictício')")
        rec("L04 fila antiga: nenhuma gravação direta enviada e o banco não mudou", not diretas and r == "pending/0", f"{diretas[:2]} {r}")
        itens = pg.locator("div.rounded-md, div.rounded-lg, div.border").filter(has_text="fila antiga, gravação direta")
        botoes = await pg.get_by_role("button", name=re.compile("Tentar agora|Enviar mesmo assim")).count()
        rec("L04b tela offline: aviso próprio, 'Não enviado' com o motivo, sem botão de enviar e sem chamar de duplicado",
            txt.count("Não enviado") >= 2 and "antigo(s) não enviado(s)" in txt and "não contornar" in txt and botoes == 0 and "podem estar duplicados" not in txt,
            f"botões={botoes} " + txt[txt.find("Modo Offline"):][:300].replace("\n", " "))
        await pg.screenshot(path=str(S / "l04_fila_bloqueada.png"))
        await c.close()

        # ── L05 Gravação direta pela API com sessão real (contorno fora da tela) ──
        H = sessao("user.a@ficticio.test"); HE = sessao("entregador.a@ficticio.test")
        tent = {
            "forma de pagamento da venda concluída": requests.patch(f"{GW}/rest/v1/orders?id=eq.{VENDA}", json={"payment_method": "pix"}, headers=H),
            "venda já entregue": requests.post(f"{GW}/rest/v1/orders", json={"user_id": OPER, "organization_id": ORG, "client_name": "API Direta Fictícia", "status": "delivered", "tipo_venda": "recarga", "product": "Gás P13", "price": 125, "quantity": 1}, headers=H),
            "promissória quitada": requests.post(f"{GW}/rest/v1/promissory_notes", json={"organization_id": ORG, "client_name": "API Direta Fictícia", "value": 100, "paid_amount": 100, "status": "paid", "due_date": "2026-01-01"}, headers=H),
            "baixa de venda na portaria": requests.post(f"{GW}/rest/v1/movimentacoes_portaria", json={"organization_id": ORG, "tipo": "venda", "produto": "P13", "delta_cheios": -1}, headers=H),
            "entregador se atribui": requests.patch(f"{GW}/rest/v1/orders?id=eq.{OK}", json={"delivery_person_id": ENT, "status": "assigned"}, headers=HE),
        }
        recusadas = {k: (v.status_code >= 400 or v.text.strip() in ("", "[]")) for k, v in tent.items()}
        r = q(f"select (select payment_method from orders where id='{VENDA}')||'/'||(select count(*) from orders where client_name='API Direta Fictícia')||'/'||(select count(*) from promissory_notes where client_name='API Direta Fictícia')||'/'||(select coalesce(delivery_person_id::text,'-') from orders where id='{OK}')")
        rec("L05 gravações diretas com sessão real são recusadas e nada muda", all(recusadas.values()) and r == "money/0/0/-",
            f"{ {k: v.status_code for k, v in tent.items()} } {r}")

        # ── L06–L08 Contenção: app do entregador pausado, portaria conclui ──
        como(OPER, f"select atribuir_entrega('{OK}','{ENT}',true,'kk-l4-k1')")
        arquivo("004_contencao.sql")
        c = await b.new_context(viewport={"width": 430, "height": 1400}); pg = await c.new_page(); ctx_guard(pg)
        await login(pg, "entregador.a@ficticio.test")
        await pg.goto(BASE + "/entregador/entregas", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        card = pg.locator("div", has_text="Cliente Contenção Navegador").last
        await pg.get_by_role("button", name=re.compile("Aceitar")).first.click(); await pg.wait_for_timeout(2500)
        t = await toasts(pg)
        rec("L06 contenção: entregador não consegue aceitar, vê o aviso e o pedido fica atribuído",
            q(f"select status from orders where id='{OK}'") == "assigned" and re.search("permiss|não", t, re.I), t[:160])
        await pg.screenshot(path=str(S / "l06_contencao_entregador.png")); await c.close()

        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); ctx_guard(pg)
        await login(pg, "user.a@ficticio.test")
        await pg.goto(BASE + "/orders", wait_until="networkidle"); await pg.wait_for_timeout(2000)
        row = pg.locator("tr", has_text="Cliente Contenção Navegador")
        await row.get_by_role("button", name=re.compile("Iniciado")).click(); await pg.wait_for_timeout(2500)
        row = pg.locator("tr", has_text="Cliente Contenção Navegador")
        await row.get_by_role("button", name=re.compile("Concluir")).click(); await pg.wait_for_timeout(1200)
        dlg = pg.get_by_role("dialog")
        if await dlg.locator("#receivedValue").count(): await dlg.locator("#receivedValue").fill("125")
        await pg.screenshot(path=str(S / "l07_portaria_conclui.png"))
        btn = dlg.get_by_role("button", name="Confirmar Entrega")
        await asyncio.gather(btn.click(), btn.click(force=True, no_wait_after=True), return_exceptions=True)
        await pg.wait_for_timeout(3500)
        r = q(f"select (select status from orders where id='{OK}')||'/'||(select count(*) from recebimentos where order_id='{OK}')||'/'||(select sum(delta_cheios) from carga_movimentos where order_id='{OK}')||'/'||(select price from orders where id='{OK}')")
        rec("L07 contenção: portaria conclui (toque duplo): 1 recebimento, carga do pedido zerada, preço intacto",
            r == "completed/1/0/125.00", r + " " + (await toasts(pg))[:120])
        arquivo("004_contencao_desfazer.sql")
        e = como(ENT, f"select entregador_concluir_entrega('{OK}','money',0,'concluir-entrega:{OK}')")
        r = q(f"select (select count(*) from recebimentos where order_id='{OK}')||'/'||(select sum(delta_cheios) from carga_movimentos where order_id='{OK}')")
        rec("L08 depois de desfazer: conclusão atrasada do entregador não registra nada de novo", r == "1/0", r)
        await c.close()

        # ── L09–L10 Administrador: cancelamento pela tela (decisão B) e painel ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); ctx_guard(pg)
        await login(pg, "admin.a@ficticio.test")
        await pg.goto(BASE + "/entrance/history", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        row = pg.locator("tr", has_text="Cliente Balcão Lote4")
        await row.get_by_role("button", name=re.compile("Cancelar")).click(); await pg.wait_for_timeout(800)
        dlg = pg.get_by_role("alertdialog")
        aviso = await dlg.inner_text()
        await dlg.locator("textarea").fill("Teste de cancelamento pela tela")
        await dlg.get_by_role("button", name="Confirmar cancelamento").click(); await pg.wait_for_timeout(3000)
        t = await toasts(pg)
        r = q(f"select (select status from orders where id='{VENDA}')||'/'||(select count(*) from auditoria_correcoes where registro_id='{VENDA}')")
        rec("L09 tela de cancelamento não promete estorno automático", "estornados automaticamente" not in aviso and "Não há estorno automático" in aviso, aviso.replace("\n", " ")[:200])
        rec("L09b administrador não cancela venda concluída pela tela: recusa visível, venda intacta", r == "delivered/0" and re.search("Erro", t), r + " " + t[:160])
        await pg.screenshot(path=str(S / "l09_cancelamento_recusado.png"))
        await pg.goto(BASE + "/dashboard", wait_until="networkidle"); await pg.wait_for_timeout(4000)
        flow = pg.locator("[aria-label='Fluxo do dia']")
        txt = (await flow.inner_text()).replace("\xa0", " ") if await flow.count() else ""
        rec("L10 painel: vendas concluídas, recebido hoje, saldo a receber, vencido e divergências separados",
            all(k in txt for k in ["Vendas concluídas", "Recebido hoje", "Saldo a receber", "Saldo vencido", "Divergências"]), txt.replace("\n", " ")[:300])
        if await flow.count(): await flow.screenshot(path=str(S / "l10_painel.png"))
        await c.close()

        # ── L12–L13 Venda pelo formulário da portaria (caixa) ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); ctx_guard(pg)
        await login(pg, "user.a@ficticio.test")
        await pg.goto(BASE + "/entrance", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        NOTA = "Venda registrada na portaria"
        contar = lambda: q(f"select (select count(*) from orders where notes='{NOTA}')||'/'||(select count(*) from recebimentos)||'/'||(select count(*) from movimentacoes_portaria where tipo='venda')")
        base = [int(x) for x in contar().split("/")]
        await pg.get_by_role("button", name=re.compile("Nova Venda")).first.click(); await pg.wait_for_timeout(1500)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("#paymentMethod").click(); await pg.get_by_role("option", name="Dinheiro").click()
        await dlg.locator("#unitPrice").fill("120")
        perdidas = []
        await pg.route("**/rest/v1/rpc/venda_portaria", perde_resposta)
        perdidas.clear()
        btn = dlg.get_by_role("button", name="Registrar Venda")
        await asyncio.gather(btn.click(), btn.click(force=True, no_wait_after=True), return_exceptions=True)
        await pg.wait_for_timeout(3000)
        t = await toasts(pg); aberto = await dlg.is_visible(); r1 = [int(x) for x in contar().split("/")]
        rec("L12 caixa: toque duplo + resposta perdida — uma gravação, erro na tela e formulário continua aberto",
            aberto and "Venda não registrada" in t and r1[0] - base[0] == 1, f"aberto={aberto} {r1} base={base} {t[:120]}")
        await pg.screenshot(path=str(S / "l12_caixa_resposta_perdida.png"))
        await pg.unroute("**/rest/v1/rpc/venda_portaria")
        await btn.click(); await pg.wait_for_timeout(3000)
        r2 = [int(x) for x in contar().split("/")]
        rec("L12b caixa: reenvio usa a mesma chave — uma venda, um recebimento, uma baixa; formulário fecha",
            r2 == [base[0] + 1, base[1] + 1, base[2] + 1] and not await dlg.is_visible(), f"{r2} base={base}")
        agreg0 = q("select (select count(*) from conta_botijoes)||'/'||(select count(*) from orders)")
        await pg.get_by_role("button", name=re.compile("Nova Venda")).first.click(); await pg.wait_for_timeout(1500)
        dlg = pg.get_by_role("dialog")
        await dlg.get_by_role("tab", name=re.compile("Agregado")).click(); await pg.wait_for_timeout(800)
        await dlg.get_by_role("combobox").first.click(); await pg.get_by_role("option", name=re.compile("Agregado Fictício")).click()
        await dlg.get_by_role("button", name="Registrar Venda").click(); await pg.wait_for_timeout(2500)
        t = await toasts(pg); agreg1 = q("select (select count(*) from conta_botijoes)||'/'||(select count(*) from orders)")
        rec("L13 venda 'a acertar' para agregado (decisão 13 pendente): recusada, nada gravado nem na ficha do parceiro",
            agreg1 == agreg0 and "a acertar" in t and await dlg.is_visible(), f"{agreg0} -> {agreg1} {t[:160]}")
        await pg.screenshot(path=str(S / "l13_agregado_recusado.png"))
        await c.close()

        rec("L11 nenhuma chamada saiu para o backend real", len(prod_hits) == 0, prod_hits[:3])
        await b.close()
    (D / "results_lote4.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))
    print(f"browser lote 4: {sum(r['ok'] for r in results)}/{len(results)}")

asyncio.run(main())
