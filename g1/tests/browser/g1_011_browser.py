# G1 011 — decisão B (reversão controlada) no navegador contra backend ISOLADO (127.0.0.1), dados fictícios.
# Cobre: operador solicita devolução (nada muda antes da autorização); devolução parcial indisponível com explicação;
# admin autoriza; retorno físico na portaria; reembolso em dinheiro pelo caixa; promissória parcialmente paga
# (cancela o saldo, cria R$40 a reembolsar, preserva o recebimento); recusa sem efeitos.
import asyncio, json, os, re, subprocess
from pathlib import Path
import requests
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots_011"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; GW = "http://127.0.0.1:58000"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
ORG = "0a000000-0000-4000-8000-000000000000"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
ANON = next(l.split("=", 1)[1].strip() for l in open("/tmp/iso-fe/.env") if l.startswith("VITE_SUPABASE_PUBLISHABLE_KEY="))
assert "127.0.0.1:58000" in open("/tmp/iso-fe/.env").read(), "cópia isolada não aponta para o gateway local"
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": str(detail)[:400]}); print("PASS" if ok else "FAIL", name, str(detail)[:300], flush=True)
def q(sql):
    return subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV).stdout.strip()
def saldo(prod="P13"):
    return q(f"select coalesce(sum(delta_cheios),0)||'/'||coalesce(sum(delta_vazios),0) from movimentacoes_portaria where organization_id='{ORG}' and produto='{prod}' and data_operacao=data_operacional()")
def sessao(email):
    r = requests.post(f"{GW}/auth/v1/token?grant_type=password", json={"email": email, "password": PW}, headers={"apikey": ANON}, timeout=10)
    return {"apikey": ANON, "Authorization": "Bearer " + r.json()["access_token"], "Content-Type": "application/json"}
def rpc(h, fn, **args):
    r = requests.post(f"{GW}/rest/v1/rpc/{fn}", data=json.dumps(args, ensure_ascii=False).encode(), headers=h, timeout=15); assert r.status_code < 300, r.text; return r.json()
async def login(page, email):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click()
    await page.wait_for_timeout(4500)
async def toasts(page):
    return " | ".join(await page.locator("[data-sonner-toast], [role='status'], [role='alert']").all_inner_texts())
def venda(h, cli, forma, chave):
    return rpc(h, "venda_portaria", _cliente_id=None, _cliente_nome=cli, _produto="P13", _quantidade=1, _valor=125, _forma=forma,
               _tipo_venda="recarga", _devolveu_vazio=True, _reseller_id=None, _observacoes=None, _chave=chave, _vasilhames_recebidos=1, _comodato=False)

async def main():
    hu = sessao("user.a@ficticio.test")
    v1 = venda(hu, "Cliente Devolve 011", "money", "k-b011-venda-1")
    v2 = venda(hu, "Cliente Prazo 011", "promissoria", "k-b011-venda-2")
    nota = q(f"select id from promissory_notes where order_id='{v2}'")
    rpc(hu, "receber_promissoria", _id=nota, _valor=40, _forma="dinheiro", _chave="k-b011-rec-40", _cobrador_id=None)
    v3 = venda(hu, "Cliente Recusa 011", "money", "k-b011-venda-3")
    base_saldo = saldo()
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        prod_hits = []
        def guard(pg): pg.on("request", lambda r: ("supabase.co" in r.url or "lovable.app" in r.url) and prod_hits.append(r.url))

        # ── Operador solicita devolução integral ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); guard(pg)
        await login(pg, "user.a@ficticio.test")
        await pg.goto(BASE + "/entrance/history", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        row = pg.locator("tr", has_text="Cliente Devolve 011")
        await row.get_by_role("button", name="Reverter").click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        parcial = dlg.locator("label", has_text="Devolução parcial")
        txt = await parcial.inner_text()
        disabled = await parcial.get_by_role("radio").is_disabled()
        rec("B01 devolução parcial aparece indisponível, com explicação", disabled and "ainda não está disponível" in txt, txt)
        await dlg.locator("label").filter(has_text=re.compile(r"^Devolução integral$")).click()
        await dlg.locator("#motivo-reversao").fill("Cliente desistiu da recarga")
        await pg.screenshot(path=str(S / "b02_solicitar.png"))
        await dlg.get_by_role("button", name="Solicitar").click(); await pg.wait_for_timeout(3000)
        r = q(f"select status from reversoes where order_id='{v1}'")
        rec("B02 operador solicita: fica aguardando autorização; estoque e dinheiro não mudam", r == "solicitada" and saldo() == base_saldo
            and q(f"select count(*) from reembolsos") == "0", f"status={r} saldo={saldo()} base={base_saldo} {await toasts(pg)}")
        await c.close()

        # ── Admin autoriza, confirma retorno físico e reembolso ──
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page(); guard(pg)
        await login(pg, "admin.a@ficticio.test")
        await pg.goto(BASE + "/reversoes", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        await pg.screenshot(path=str(S / "b03_lista.png"))
        card = pg.locator("div.rounded-lg, div[class*='card']").filter(has_text="Cliente Devolve 011").last
        await pg.get_by_role("button", name="Autorizar ou recusar").first.click(); await pg.wait_for_timeout(800)
        await pg.get_by_role("dialog").get_by_role("button", name="Autorizar").click(); await pg.wait_for_timeout(3000)
        r = q(f"select status||'/'||esperado_cheios||'/'||esperado_vazios_cliente||'/'||valor_reembolso from reversoes where order_id='{v1}'")
        rec("B03 admin autoriza: aguarda retorno de 1 cheio e 1 vazio ao cliente; R$125 a reembolsar; estoque ainda igual",
            r == "aguardando_retorno/1/1/125" and saldo() == base_saldo, f"{r} saldo={saldo()}")
        await pg.get_by_role("button", name="Confirmar retorno físico").first.click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.get_by_role("combobox").nth(1).click(); await pg.get_by_role("option", name="Lacrado / sem uso").click()
        await pg.screenshot(path=str(S / "b04_fisico.png"))
        await dlg.get_by_role("button", name="Confirmar").click(); await pg.wait_for_timeout(3000)
        ch0, vz0 = map(int, base_saldo.split("/"))
        r = q(f"select status from reversoes where order_id='{v1}'")
        rec("B04 retorno na portaria: cheio volta, vazio do cliente sai; fica o reembolso pendente",
            r == "reembolso_pendente" and saldo() == f"{ch0+1}/{vz0-1}", f"{r} saldo={saldo()} {await toasts(pg)}")
        await pg.get_by_role("tab", name=re.compile("Reembolsos")).click(); await pg.wait_for_timeout(800)
        await pg.get_by_role("button", name="Registrar reembolso feito").first.click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("label", has_text="Caixa da portaria").click()
        await dlg.get_by_role("button", name="Confirmar reembolso").click(); await pg.wait_for_timeout(3000)
        r = q(f"select v.status||'/'||v.valor_reembolsado||'/'||e.origem||'/'||(select count(*) from recebimentos where order_id='{v1}') from reversoes v join reembolsos e on e.reversao_id=v.id where v.order_id='{v1}'")
        o = q(f"select status||'/'||price from orders where id='{v1}'")
        rec("B05 reembolso pelo caixa: reversão concluída; recebimento e venda originais preservados", r == "concluida/125/caixa/1" and o == "delivered/125.00", f"{r} pedido={o}")

        # ── Promissória parcialmente paga, autorizada direto pelo admin no histórico ──
        await pg.goto(BASE + "/entrance/history", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        await pg.locator("tr", has_text="Cliente Prazo 011").get_by_role("button", name="Reverter").click(); await pg.wait_for_timeout(1000)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("label").filter(has_text=re.compile(r"^Devolução integral$")).click()
        await dlg.locator("#motivo-reversao").fill("Devolução integral do botijão")
        await dlg.get_by_role("button", name="Autorizar").click(); await pg.wait_for_timeout(3000)
        r = q(f"select v.promissoria_cancelada||'/'||v.valor_reembolso||'/'||n.status||'/'||n.paid_amount||'/'||(select count(*)||':'||sum(valor) from recebimentos where promissory_id=n.id)||'/'||(select count(*)||':'||sum(valor) from reembolsos where reversao_id=v.id and status='pendente') from reversoes v join promissory_notes n on n.order_id=v.order_id where v.order_id='{v2}'")
        rec("B06 promissória R$125 com R$40 pagos: cancela R$85, cria R$40 a reembolsar, preserva os R$40 recebidos",
            r == "85.00/40/cancelled/40.00/1:40/1:40", r)
        await pg.goto(BASE + "/entrance/history", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        badge = await pg.locator("tr", has_text="Cliente Prazo 011").inner_text()
        await pg.screenshot(path=str(S / "b06_historico.png"))
        rec("B07 a venda original mostra o andamento da reversão", "Devolução integral: Produto aguardando retorno" in badge, badge.replace("\n", " ")[:200])

        # ── Recusa: nenhum efeito ──
        hu2 = sessao("user.a@ficticio.test")
        rid = rpc(hu2, "reversao_solicitar", _order_id=v3, _tipo="devolucao", _motivo="Cliente pediu devolução", _order_valida_id=None,
                  _pagamento_duplicado=None, _autorizar=False, _chave="k-b011-sol-3")
        await pg.goto(BASE + "/reversoes", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        await pg.get_by_role("button", name="Autorizar ou recusar").first.click(); await pg.wait_for_timeout(800)
        dlg = pg.get_by_role("dialog")
        await dlg.locator("label", has_text="Recusar").click()
        await dlg.locator("#motivo-recusa").fill("Produto já foi usado pelo cliente")
        s0 = saldo()
        await dlg.get_by_role("button", name="Recusar").click(); await pg.wait_for_timeout(3000)
        r = q(f"select status||'/'||(select count(*) from reembolsos where reversao_id='{rid}') from reversoes where id='{rid}'")
        rec("B08 admin recusa: sem estoque, sem reembolso", r == "recusada/0" and saldo() == s0, f"{r} saldo={saldo()}")
        await pg.screenshot(path=str(S / "b08_recusa.png"))
        await pg.goto(BASE + "/dashboard", wait_until="networkidle"); await pg.wait_for_timeout(4000)
        painel = await pg.locator("body").inner_text()
        await pg.screenshot(path=str(S / "b09_painel.png"))
        rec("B09 painel mostra reversões separadas das vendas (a reembolsar R$ 40,00)", "Reversões (separadas das vendas)" in painel and "R$ 40,00" in painel, "")
        rec("B10 nenhuma chamada a servidores reais", not prod_hits, prod_hits[:3])
        await b.close()
    ok = sum(r["ok"] for r in results)
    print(f"\nnavegador 011: {ok}/{len(results)}")
    (D / "results_011.json").write_text(json.dumps({"total": len(results), "ok": ok, "results": results}, ensure_ascii=False, indent=1))

asyncio.run(main())
