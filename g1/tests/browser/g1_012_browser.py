# G1 012 — fluxo de entregas no navegador contra backend ISOLADO (127.0.0.1), só dados fictícios.
# Botões exercitados pela tela: Atribuir, Aceitar/Recusar (app do entregador), Reatribuir (com e sem transferência),
# Cancelar/fechar formulários, Concluir entrega (paga, a prazo, resposta perdida, toque duplo), filtros Hoje/Atrasadas/
# Agendadas, fechamento total bloqueado (tela e chamada direta), regularização de registro antigo.
import asyncio, json, os, re, subprocess, uuid
from pathlib import Path
import requests
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots_012"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; GW = "http://127.0.0.1:58000"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
ORG = "0a000000-0000-4000-8000-000000000000"; ORG_B = "0b000000-0000-4000-8000-000000000000"
E1, E2 = "a0000000-0000-4000-8000-00000000000d", "a0000000-0000-4000-8000-0000000000f2"
UA, UB = "a0000000-0000-4000-8000-00000000000b", "b0000000-0000-4000-8000-00000000000a"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
ANON = next(l.split("=", 1)[1].strip() for l in open("/tmp/iso-fe/.env") if l.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
assert "127.0.0.1:58000" in open("/tmp/iso-fe/.env").read(), "cópia isolada não aponta para o gateway local"
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": str(detail)[:400]}); print("PASS" if ok else "FAIL", name, str(detail)[:300], flush=True)
def q(sql):
    r = subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV); return r.stdout.strip() or r.stderr.strip()
num = lambda i: "#" + i.replace("-", "")[:8].upper()
def sessao(email):
    r = requests.post(f"{GW}/auth/v1/token?grant_type=password", json={"email": email, "password": PW}, headers={"apikey": ANON}, timeout=10)
    return {"apikey": ANON, "Authorization": "Bearer " + r.json()["access_token"], "Content-Type": "application/json"}
def rpc(h, fn, **args):
    r = requests.post(f"{GW}/rest/v1/rpc/{fn}", data=json.dumps(args, ensure_ascii=False).encode(), headers=h, timeout=15); return r
def pedido(h, cli, uid=UA, org=ORG, prevista=None):
    i = str(uuid.uuid4())
    body = {"id": i, "user_id": uid, "organization_id": org, "client_name": cli, "product": "Gás P13", "quantity": 1, "price": 125,
            "payment_method": "money", "tipo_venda": "recarga", "origem_venda": "pedido", "entrega_prevista": prevista,
            "address": {"street": "Rua Fictícia", "number": "1"}}
    r = requests.post(f"{GW}/rest/v1/orders", data=json.dumps(body, ensure_ascii=False).encode(), headers=h, timeout=15)
    assert r.status_code < 300, r.text
    return i
st = lambda i: q(f"select status||'/'||coalesce(delivery_person_id::text,'-')||'/'||(accepted_at is not null) from orders where id='{i}'")
carga = lambda e: q(f"select coalesce(sum(m.delta_cheios),0) from carga_movimentos m join cargas c on c.id=m.carga_id where c.entregador_id='{e}' and c.status='aberta' and m.produto='P13'")
async def login(page, email):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click()
    await page.wait_for_timeout(4500)
async def pedidos(page, filtro=None):
    await page.goto(BASE + "/orders" + (f"?filtro={filtro}" if filtro else ""), wait_until="networkidle"); await page.wait_for_timeout(2500)
async def escolher(page, gatilho, opcao):
    await page.locator(gatilho).click(); await page.wait_for_timeout(300)
    await page.get_by_role("option", name=opcao).click(); await page.wait_for_timeout(300)
async def texto_alertas(page):
    return " | ".join(await page.locator("[role='alert'], li[role='status'], [data-sonner-toast]").all_inner_texts())

async def main():
    hu = sessao("user.a@ficticio.test"); hb = sessao("admin.b@ficticio.test")
    A = pedido(hu, "Cliente Rota 012")            # atribuir -> aceitar -> reatribuir sem transferência -> concluir
    B = pedido(hu, "Cliente Transfere 012")       # reatribuir com transferência -> concluir a prazo
    C = pedido(hu, "Cliente Recusa 012")          # recusa pelo entregador
    AG = pedido(hu, "Cliente Agendado 012", prevista=q("select (data_operacional()+2)::text"))
    BAL = rpc(hu, "venda_portaria", _cliente_id=None, _cliente_nome="Cliente Balcão 012", _produto="P13", _quantidade=1, _valor=125, _forma="money",
              _tipo_venda="recarga", _devolveu_vazio=True, _reseller_id=None, _observacoes=None, _chave="k-b012-balcao-1", _vasilhames_recebidos=1, _comodato=False)
    OB = pedido(hb, "Cliente Outra Empresa 012", uid=UB, org=ORG_B)
    ONT = str(uuid.uuid4()); ANT = str(uuid.uuid4())
    q(f"insert into orders(id,user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda,origem_venda,created_at) values ('{ONT}','{UA}','{ORG}','Cliente Ontem 012','Gás P13',1,125,'money','recarga','pedido',now()-interval '1 day')")
    q(f"set session_replication_role=replica; insert into orders(id,user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda,origem_venda,status,delivery_person,assigned_at,created_at) values ('{ANT}','{UA}','{ORG}','Cliente Antigo 012','Gás P13',1,120,'money','recarga','pedido','delivering','c01ab000-0000-4000-8000-000000000001',now()-interval '90 days',now()-interval '90 days')")

    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        prod_hits = []
        def guard(pg): pg.on("request", lambda r: ("supabase.co" in r.url or "lovable.app" in r.url) and prod_hits.append(r.url))
        cu = await b.new_context(viewport={"width": 1280, "height": 1800}); op = await cu.new_page(); guard(op)
        chamadas = []
        op.on("request", lambda r: "/rest/v1/rpc/" in r.url and chamadas.append(r.url.rsplit("/", 1)[1]))
        await login(op, "user.a@ficticio.test")

        # 1. Lista padrão: hoje + atrasadas abertas; balcão, agendada e outra empresa fora
        await pedidos(op)
        corpo = await op.locator("main").inner_text()
        rec("B01 lista padrão mostra o pedido pelo número", num(A) in corpo and "Cliente Rota 012" in corpo)
        rec("B02 entrega de ontem continua na lista, marcada como atrasada", "Cliente Ontem 012" in corpo and "Atrasada" in corpo)
        rec("B03 balcão, agendada e outra empresa fora da lista padrão",
            "Cliente Balcão 012" not in corpo and "Cliente Agendado 012" not in corpo and "Cliente Outra Empresa 012" not in corpo)
        rec("B04 registro antigo aparece com 'Revisão necessária' e sem Atribuir/Concluir para o operador",
            await op.locator("tr", has_text="Cliente Antigo 012").get_by_text("Revisão necessária").count() > 0
            and await op.locator("tr", has_text="Cliente Antigo 012").get_by_role("button", name=re.compile("Atribuir|Concluir|Regularizar")).count() == 0)
        await op.get_by_role("tab", name=re.compile("^Agendadas")).click(); await op.wait_for_timeout(2500)
        rec("B05 filtro Agendadas mostra a entrega futura", "Cliente Agendado 012" in await op.locator("main").inner_text())
        await op.get_by_role("tab", name=re.compile("^Hoje e atrasadas")).click(); await op.wait_for_timeout(2500)
        await op.screenshot(path=str(S / "b01_lista.png"))

        # 2. Atribuir pela tela (sai da portaria para a carga do entregador 1)
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Atribuir").click(); await op.wait_for_timeout(800)
        await escolher(op, "#deliveryPerson", "Entregador A")
        await op.get_by_role("dialog").get_by_text("Sai agora da portaria com ele").click(); await op.wait_for_timeout(1200)
        await op.get_by_role("dialog").get_by_role("button", name="Confirmar", exact=True).click(); await op.wait_for_timeout(3000)
        rec("B06 Atribuir grava por ID e aguarda aceite; produto vai para a carga dele", st(A) == f"assigned/{E1}/false" and carga(E1) == "1", (st(A), carga(E1)))

        # 3. Cancelar/fechar formulários não chama o banco nem mostra erro
        await pedidos(op)
        antes = list(chamadas)
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(600)
        await op.get_by_role("dialog").get_by_role("button", name="Cancelar").click(); await op.wait_for_timeout(600)
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Concluir entrega").click(); await op.wait_for_timeout(600)
        await op.keyboard.press("Escape"); await op.wait_for_timeout(800)
        novas = [c for c in chamadas[len(antes):] if c in ("reatribuir_entrega", "operador_concluir_entrega")]
        erro_txt = await texto_alertas(op)
        rec("B07 cancelar Reatribuir e fechar Concluir: nenhuma gravação, nenhum aviso de erro, pedido igual",
            not novas and "não" not in erro_txt.lower() and st(A) == f"assigned/{E1}/false", (novas, erro_txt))

        # 4. Entregador vê o mesmo número e aceita; outro pedido ele recusa
        q(f"select 1")  # (marcador)
        ce = await b.new_context(viewport={"width": 430, "height": 1400}); en = await ce.new_page(); guard(en)
        await login(en, "entregador.a@ficticio.test")
        rpc(hu, "atribuir_entrega", _order_id=C, _entregador_id=E1, _retirar_da_portaria=False, _chave=None)
        await en.goto(BASE + "/entregador/entregas", wait_until="networkidle"); await en.wait_for_timeout(3000)
        t = await en.locator("main").inner_text()
        rec("B08 app do entregador mostra o mesmo número do pedido", num(A) in t and num(C) in t, t[:300])
        await en.screenshot(path=str(S / "b08_entregador.png"))
        card = en.locator("div.rounded-lg, [class*='card']", has_text=num(A)).first
        await card.get_by_role("button", name="Aceitar").click(); await en.wait_for_timeout(2500)
        rec("B09 Aceitar pela tela: em rota, sem concluir nem receber", st(A) == f"delivering/{E1}/true"
            and q(f"select count(*) from recebimentos where order_id='{A}'") == "0", st(A))
        card = en.locator("div.rounded-lg, [class*='card']", has_text=num(C)).first
        await card.get_by_role("button", name="Recusar entrega").click(); await en.wait_for_timeout(600)
        await en.get_by_role("dialog").locator("textarea").fill("Pneu furado na rota")
        await en.get_by_role("dialog").get_by_role("button", name="Confirmar recusa").click(); await en.wait_for_timeout(2500)
        await pedidos(op)
        linha_c = await op.locator("tr", has_text="Cliente Recusa 012").inner_text()
        rec("B10 recusa registrada aparece diferente de 'aguardando aceite'", "Recusada" in linha_c and "Pneu furado" in linha_c and "Aguardando aceite" not in linha_c, linha_c)

        # 5. Reatribuir sem transferência: aceite anterior perde valor e conclusão fica bloqueada pela carga
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(800)
        dlg = op.get_by_role("dialog")
        rec("B11 Reatribuir mostra o entregador atual", "Entregador A" in await dlg.inner_text())
        await escolher(op, "#novoEntregador", "Entregador Dois A")
        await dlg.locator("#motivoReatribuir").fill("Moto do entregador A quebrou")
        await dlg.get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(3000)
        rec("B12 reatribuição exige novo aceite e não move o produto", st(A) == f"assigned/{E2}/false" and carga(E1) == "1" and carga(E2) == "0", (st(A), carga(E1), carga(E2)))
        await pedidos(op)
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Concluir entrega").click(); await op.wait_for_timeout(2000)
        dlg = op.get_by_role("dialog"); txt = await dlg.inner_text()
        rec("B13 Concluir com produto ainda na carga anterior: explica e não deixa concluir",
            "precisa de 1" in txt and await dlg.get_by_role("button", name="Concluir entrega").is_disabled(), txt[:300])
        await op.screenshot(path=str(S / "b13_concluir_bloqueado.png"))
        await op.keyboard.press("Escape"); await op.wait_for_timeout(500)
        # volta para o entregador A pela tela (o produto está com ele)
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(800)
        await escolher(op, "#novoEntregador", "Entregador A")
        await op.get_by_role("dialog").locator("#motivoReatribuir").fill("Entregador A voltou para a rota")
        await op.get_by_role("dialog").get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(3000)

        # 6. Concluir paga em dinheiro com resposta perdida e toque duplo
        await pedidos(op)
        await op.locator("tr", has_text="Cliente Rota 012").get_by_role("button", name="Concluir entrega").click(); await op.wait_for_timeout(2000)
        dlg = op.get_by_role("dialog")
        await escolher(op, "#formaEfetiva", "Dinheiro")
        await dlg.locator("#valorRecebido").fill("125"); await dlg.locator("#cascosRecebidos").fill("1")
        perdeu = {"n": 0}
        async def corta(route):
            if perdeu["n"] == 0:
                perdeu["n"] = 1
                await route.fetch()          # o banco grava...
                return await route.abort()   # ...mas a resposta se perde
            await route.continue_()
        await op.route("**/rest/v1/rpc/operador_concluir_entrega", corta)
        await dlg.get_by_role("button", name="Concluir entrega").click(); await op.wait_for_timeout(2500)
        aberto = await op.get_by_role("dialog").count() > 0
        rec("B14 resposta perdida: formulário continua aberto com aviso", aberto and "não concluída" in (await op.get_by_role("dialog").inner_text()).lower())
        btn = op.get_by_role("dialog").get_by_role("button", name="Concluir entrega")
        await btn.dblclick(); await op.wait_for_timeout(3000)
        await op.unroute("**/rest/v1/rpc/operador_concluir_entrega")
        rec("B15 nova tentativa + toque duplo: uma conclusão, um recebimento de 125 e uma baixa",
            q(f"select status from orders where id='{A}'") == "completed"
            and q(f"select count(*)||'/'||sum(valor) from recebimentos where order_id='{A}'") in ("1/125", "1/125.00")
            and q(f"select count(*) from carga_movimentos where order_id='{A}' and tipo='consumo_entrega'") == "1",
            q(f"select count(*)||'/'||coalesce(sum(valor),0) from recebimentos where order_id='{A}'"))

        # 7. Reatribuir COM transferência física e concluir a prazo
        rpc(hu, "atribuir_entrega", _order_id=B, _entregador_id=E1, _retirar_da_portaria=True, _chave="k-b012-atr-b")
        await pedidos(op)
        await op.locator("tr", has_text="Cliente Transfere 012").get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(1500)
        dlg = op.get_by_role("dialog")
        await escolher(op, "#novoEntregador", "Entregador Dois A")
        await dlg.locator("#motivoReatribuir").fill("Entregador A passou o botijão para o Dois")
        await dlg.get_by_text("O botijão passou agora, em mãos").click()
        await dlg.get_by_role("button", name="Reatribuir").click(); await op.wait_for_timeout(3000)
        rec("B16 transferência física registrada: carga 1 → carga 2, sem baixa dupla na portaria",
            carga(E1) == "0" and carga(E2) == "1" and st(B) == f"assigned/{E2}/false", (carga(E1), carga(E2), st(B)))
        await pedidos(op)
        await op.locator("tr", has_text="Cliente Transfere 012").get_by_role("button", name="Concluir entrega").click(); await op.wait_for_timeout(2000)
        dlg = op.get_by_role("dialog")
        await escolher(op, "#formaEfetiva", "A prazo (nota promissória)")
        await dlg.locator("#cascosRecebidos").fill("0")
        await dlg.get_by_role("button", name="Concluir entrega").click(); await op.wait_for_timeout(3000)
        rec("B17 conclusão a prazo: promissória de 125, nenhum recebimento, carga 2 consumida",
            q(f"select count(*) from recebimentos where order_id='{B}'") == "0"
            and q(f"select value||'/'||status from promissory_notes where order_id='{B}'") == "125.00/pending" and carga(E2) == "0",
            q(f"select value||'/'||status from promissory_notes where order_id='{B}'"))

        # 8. Fechamento total bloqueado pela tela e por chamada direta
        await op.goto(BASE + "/entrance?fechamento=1", wait_until="networkidle"); await op.wait_for_timeout(3500)
        await op.get_by_role("tab", name=re.compile("Total")).click(); await op.wait_for_timeout(3000)
        dlg = op.get_by_role("dialog"); txt = await dlg.inner_text()
        rec("B18 tela do fechamento total mostra as entregas que impedem, com o número do pedido",
            "Fechamento total bloqueado" in txt and num(ONT) in txt and await dlg.get_by_role("button", name="Confirmar Fechamento Total").is_disabled(), txt[-600:])
        await op.screenshot(path=str(S / "b18_fechamento_bloqueado.png"))
        r = requests.post(f"{GW}/rest/v1/fechamentos_caixa", headers=hu, timeout=15, data=json.dumps({
            "data_fechamento": q("select data_operacional()::text"), "tipo": "total", "total_vendas": 0, "total_dinheiro": 0, "total_pix": 0, "total_cartao": 0,
            "total_outros": 0, "quantidades": {}, "estoque_final": [], "divergencias": [], "tem_divergencia": False, "retroativo": False}))
        rec("B19 chamada direta de fechamento total é recusada pelo banco", r.status_code >= 400 and "bloqueado" in r.text, r.text[:200])
        rec("B20 nenhum pedido foi concluído ou reagendado para liberar o caixa",
            q(f"select status||'/'||coalesce(entrega_prevista::text,'-') from orders where id='{ONT}'") == "pending/-")
        await op.keyboard.press("Escape")

        # 9. Balcão: aviso curto com link para Pedidos (o quadro antigo saiu)
        await op.goto(BASE + "/entrance", wait_until="networkidle"); await op.wait_for_timeout(3000)
        corpo = await op.locator("main").inner_text()
        rec("B21 balcão sem o quadro antigo; aviso leva a Pedidos com o número da atrasada",
            "Entregas pendentes de dias anteriores" not in corpo and "Dar baixa" not in corpo and "Ver em Pedidos" in corpo and num(ONT) in corpo, corpo[:300])
        await op.get_by_role("link", name=num(ONT)).first.click(); await op.wait_for_timeout(3000)
        dtxt = await op.get_by_role("dialog").inner_text()
        rec("B22 número do pedido abre os detalhes direto", num(ONT) in dtxt and "Cliente Ontem 012" in dtxt, dtxt[:200])

        # 10. Administrador regulariza o registro antigo (volta para a fila, com motivo e histórico)
        ca = await b.new_context(viewport={"width": 1280, "height": 1800}); ad = await ca.new_page(); guard(ad)
        await login(ad, "admin.a@ficticio.test")
        await pedidos(ad, "atrasadas")
        await ad.locator("tr", has_text="Cliente Antigo 012").get_by_role("button", name="Regularizar").click(); await ad.wait_for_timeout(800)
        dlg = ad.get_by_role("dialog")
        await dlg.locator("#motivoRegularizar").fill("Sem comprovação da entrega de agosto; volta para a fila")
        await ad.screenshot(path=str(S / "b23_regularizar.png"))
        await dlg.get_by_role("button", name="Regularizar").click(); await ad.wait_for_timeout(3000)
        rec("B23 regularização: volta para a fila, histórico guarda o entregador anotado, nada de estoque ou dinheiro",
            st(ANT) == "pending/-/false"
            and q(f"select entregador_anterior_texto from entrega_eventos where order_id='{ANT}' and tipo='regularizacao'") == "c01ab000-0000-4000-8000-000000000001"
            and q(f"select (select count(*) from carga_movimentos where order_id='{ANT}')+(select count(*) from recebimentos where order_id='{ANT}')") == "0", st(ANT))

        rec("B24 nenhuma requisição saiu para o Cloud", not prod_hits, prod_hits[:3])
        await b.close()
    ok = sum(r["ok"] for r in results); print(f"\nnavegador 012: {ok}/{len(results)}")
    json.dump({"total": len(results), "ok": ok, "itens": results}, open(D / "results_012.json", "w"), ensure_ascii=False, indent=1)

asyncio.run(main())
