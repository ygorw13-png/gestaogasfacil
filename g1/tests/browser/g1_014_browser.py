# G1 014 — formas de pagamento no navegador contra backend ISOLADO (127.0.0.1), só dados fictícios.
# Portaria: 5 formas obrigatórias recusam valor vazio e aceitam valor válido; 3 opcionais aceitam sem valor;
# as 8 mantêm a identidade depois de gravar e recarregar "Vendas recentes"; Gás do Povo não vira Convênio.
# Venda na rua sem internet com Gás do Povo: fila, volta da internet, uma venda só, mesma forma.
# Pressupõe: lab_reset.sh com014 e build_iso_fe.sh. Recusa rodar se o app não apontar para o servidor local.
import asyncio, json, os, re, subprocess
from pathlib import Path
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots_014"; S.mkdir(exist_ok=True)
BASE = "http://localhost:8091"; PW = "senha-ficticia-123"
DB = "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
ORG = "0a000000-0000-4000-8000-000000000000"; ENT = "a0000000-0000-4000-8000-00000000000d"
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
assert "127.0.0.1:58000" in open("/tmp/iso-fe/.env").read(), "cópia isolada não aponta para o gateway local"
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": str(detail)[:400]}); print("PASS" if ok else "FAIL", name, str(detail)[:250], flush=True)
def q(sql):
    r = subprocess.run(["psql", DB, "-XAtc", sql], capture_output=True, text=True, env=ENV); return r.stdout.strip() or r.stderr.strip()
async def login(page, email):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click()
    await page.wait_for_timeout(4500)
async def toasts(page):
    return " | ".join(await page.locator("[role='alert'], [data-sonner-toast], li[role='status']").all_inner_texts())
NOTA = "Venda registrada na portaria"
ultima = lambda: q(f"select coalesce(payment_method,'-')||'/'||coalesce(price::text,'NULL')||'/'||(select count(*) from recebimentos r where r.order_id=o.id)||'/'||(select count(*) from promissory_notes p where p.order_id=o.id) from orders o where notes='{NOTA}' order by created_at desc limit 1")
conta = lambda: int(q(f"select count(*) from orders where notes='{NOTA}'"))

OBRIG = [("Dinheiro", "money", "Dinheiro"), ("Cartão de Crédito", "credit", "Crédito"), ("Cartão de Débito", "debit", "Débito"),
         ("PIX", "pix", "PIX"), ("Promissória", "promissoria", "Promissória")]
OPC = [("Gás do Povo", "gas-povo", "Gás do Povo"), ("Vale-Gás", "vale-gas", "Vale Gás"), ("Convênio", "convenio", "Convênio")]

async def nova_venda(pg, opcao):
    await pg.get_by_role("button", name=re.compile("Nova Venda")).first.click(); await pg.wait_for_timeout(1200)
    dlg = pg.get_by_role("dialog")
    await dlg.locator("#paymentMethod").click(); await pg.get_by_role("option", name=opcao, exact=True).click(); await pg.wait_for_timeout(300)
    return dlg

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        prod = []
        c = await b.new_context(viewport={"width": 1280, "height": 1800}); pg = await c.new_page()
        pg.on("request", lambda r: ("supabase.co" in r.url or "lovable.app" in r.url) and prod.append(r.url))
        await login(pg, "user.a@ficticio.test")
        await pg.goto(BASE + "/entrance", wait_until="networkidle"); await pg.wait_for_timeout(2500)

        for i, (opcao, cod, rot) in enumerate(OBRIG):
            antes = conta()
            dlg = await nova_venda(pg, opcao)
            await dlg.locator("#unitPrice").fill("")
            await dlg.get_by_role("button", name="Registrar Venda").click(); await pg.wait_for_timeout(1500)
            t = await dlg.inner_text()
            rec(f"F{i+1}a {rot}: valor vazio recusado na tela, nada gravado",
                await dlg.is_visible() and conta() == antes and "maior que zero" in t, re.sub(r"\s+", " ", t)[-160:])
            if i == 0: await pg.screenshot(path=str(S / "f1_obrigatorio_recusa.png"))
            await dlg.locator("#unitPrice").fill("120,50" if i == 1 else "120")
            await dlg.get_by_role("button", name="Registrar Venda").click(); await pg.wait_for_timeout(2500)
            r = ultima(); esperado_rec = "0/1" if cod == "promissoria" else "1/0"
            rec(f"F{i+1}b {rot}: valor válido aceito, gravado como '{cod}'",
                conta() == antes + 1 and r == f"{cod}/{'120.50' if i == 1 else '120.00'}/{esperado_rec}" and not await dlg.is_visible(), r)

        for j, (opcao, cod, rot) in enumerate(OPC):
            antes = conta()
            dlg = await nova_venda(pg, opcao)
            await dlg.locator("#unitPrice").fill("")
            t = await dlg.locator("#totalPrice").input_value()
            if j == 0: await pg.screenshot(path=str(S / "f6_gas_povo_sem_valor.png"))
            await dlg.get_by_role("button", name="Registrar Venda").click(); await pg.wait_for_timeout(2500)
            r = ultima(); tt = await toasts(pg)
            rec(f"F{6+j} {rot}: aceito sem valor — preço não informado, sem recebimento nem promissória",
                conta() == antes + 1 and r == f"{cod}/NULL/0/0" and not await dlg.is_visible() and t == "Não informado" and "nenhum recebimento" in tt, f"{r} total={t} {tt}"[:200])

        # Recarregar e conferir as 8 identidades em Vendas recentes
        await pg.reload(wait_until="networkidle"); await pg.wait_for_timeout(3000)
        corpo = await pg.locator("main").inner_text()
        faltam = [rot for _, _, rot in OBRIG + OPC if rot not in corpo]
        rec("F09 Vendas recentes após recarregar: as 8 formas com nome próprio", not faltam, f"faltam={faltam}")
        rec("F10 Vendas recentes: 3 vendas com 'Não informado'", corpo.count("Não informado") >= 3, corpo.count("Não informado"))
        linha = pg.locator("tr", has_text="Gás do Povo").first
        lt = await linha.inner_text() if await linha.count() else ""
        rec("F11 Gás do Povo não vira Convênio (linha da venda e banco)",
            "Gás do Povo" in lt and "Convênio" not in lt and q(f"select count(*) from orders where notes='{NOTA}' and payment_method='gas-povo'") == "1", lt[:160])
        await pg.screenshot(path=str(S / "f09_vendas_recentes.png"))
        await c.close()

        # Venda na rua sem internet: Gás do Povo sem valor
        q(f"""select set_config('request.jwt.claims','{{"sub":"a0000000-0000-4000-8000-00000000000b","role":"authenticated"}}',false);
              set role authenticated; select carga_saida('{ENT}','P13',2,'kk-014-browser-carga'); reset role;""")
        c = await b.new_context(viewport={"width": 390, "height": 844}); pg = await c.new_page()
        pg.on("request", lambda r: ("supabase.co" in r.url or "lovable.app" in r.url) and prod.append(r.url))
        await login(pg, "entregador.a@ficticio.test")
        await pg.goto(BASE + "/entregador/venda-rua", wait_until="networkidle"); await pg.wait_for_timeout(2000)
        await pg.get_by_placeholder("Nome completo").fill("Cliente Rua 014")
        await pg.get_by_placeholder("(00) 00000-0000").fill("(71) 90000-0014")
        await pg.locator("label:has-text('Forma de pagamento') + button, label:has-text('Forma de pagamento') ~ button").first.click()
        await pg.get_by_role("option", name="Gás do Povo", exact=True).click(); await pg.wait_for_timeout(300)
        await pg.get_by_placeholder("0,00").fill("")
        await c.set_offline(True)
        await pg.get_by_role("button", name="Registrar Venda").click(); await pg.wait_for_timeout(2500)
        t = await toasts(pg)
        n = lambda: q("select count(*)||'/'||coalesce(string_agg(payment_method||':'||coalesce(price::text,'NULL'),','),'-') from orders where client_name='Cliente Rua 014'")
        rec("F12 sem internet: venda Gás do Povo fica no aparelho (nada no banco ainda)", n().startswith("0/") and re.search("aparelho|internet|fila", t, re.I), f"{n()} {t[:140]}")
        fila = await pg.evaluate("""() => new Promise((ok) => { const r = indexedDB.open('gasfacil-offline'); r.onsuccess = () => {
            const t = r.result.transaction('queue', 'readonly').objectStore('queue').getAll(); t.onsuccess = () => ok(JSON.stringify(t.result)); t.onerror = () => ok(''); };
            r.onerror = () => ok(''); })""")
        rec("F13 fila guarda a forma 'gas-povo' e a chave de reenvio", '"_forma":"gas-povo"' in fila and '"_chave"' in fila, fila[:200])
        await pg.screenshot(path=str(S / "f12_rua_offline.png"))
        await c.set_offline(False); await pg.evaluate("() => window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(6000)
        await pg.evaluate("() => window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(4000)
        rec("F14 volta da internet + reenvio: uma venda só, Gás do Povo, valor não informado, sem recebimento",
            n() == "1/gas-povo:NULL" and q("select count(*) from recebimentos r join orders o on o.id=r.order_id where o.client_name='Cliente Rua 014'") == "0", n())
        await c.close()

        rec("F15 nenhuma chamada saiu para o backend real", not prod, prod[:3])
        await b.close()
    ok = sum(r["ok"] for r in results); print(f"\n014 navegador: {ok}/{len(results)}")
    (D / "results_014.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))

asyncio.run(main())
