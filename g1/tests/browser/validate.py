import asyncio, sys, json
sys.path.insert(0, "/tmp/browser/g1")
from harness import *
from playwright.async_api import async_playwright
from datetime import datetime, timezone
NOW = datetime.now(timezone.utc).isoformat()
TODAY_LOCAL = datetime.now().strftime("%Y-%m-%d")
def o(i, qty, price, status, pm="money", product="GLP P13"):
    return {"id":f"00000000-0000-4000-8000-00000000c{i:03d}","user_id":UID,"organization_id":ORG,"client_name":f"Cliente Fictício {i}","client_phone":"","address":{},"product":product,"quantity":qty,"price":price,"status":status,"payment_method":pm,"created_at":NOW,"updated_at":NOW,"delivered_at":NOW if status=="delivered" else None,"tipo_venda":"recarga","vasilhames_entregues":0,"vasilhames_recebidos":qty,"origem_venda":"pedido"}
ORDERS = [o(1,2,250,"delivered","money"), o(2,1,125,"delivered","pix"), o(3,2,20,"cancelled","money","Água 20L"), o(4,1,130,"pending",None)]
R = []
def check(name, ok, detail=""):
    R.append((name, bool(ok), detail)); print(("PASS" if ok else "FAIL"), name, detail)
async def text(page): return await page.inner_text("body")

async def main():
    async with async_playwright() as pw:
        # V1 indicadores com dados fictícios
        be = Backend({"orders": ORDERS})
        b, page = await open_app(pw, be)
        await page.goto("http://localhost:8080/dashboard"); await page.wait_for_timeout(4000)
        t = await text(page); await page.screenshot(path="v1_dashboard.png")
        check("V1 dashboard: vendas de hoje = R$ 505,00 (preço total, sem cancelado)", "505,00" in t and "1.010" not in t)
        check("V1 receita do mês = R$ 505,00 (mesma regra)", t.count("505,00") >= 2, f"ocorrências={t.count('505,00')}")
        await b.close()
        # V2 falha de consulta
        be = Backend({"orders": ORDERS}); be.fail_get = {"orders"}
        b, page = await open_app(pw, be)
        await page.goto("http://localhost:8080/dashboard"); await page.wait_for_timeout(16000)
        t = await text(page); await page.screenshot(path="v2_falha.png")
        check("V2 falha: painel mostra 'Indicadores indisponíveis'", "Indicadores indisponíveis" in t)
        check("V2 falha: nenhum 0,00 exibido como vendas", "0,00" not in t)
        await b.close()
        # V3 ausência real
        be = Backend({"orders": []})
        b, page = await open_app(pw, be)
        await page.goto("http://localhost:8080/dashboard"); await page.wait_for_timeout(4000)
        t = await text(page); await page.screenshot(path="v3_vazio.png")
        check("V3 ausência real: mostra 0,00 e 0 pedidos, sem falha", "Vendas de Hoje\n0,00" in t and "Pedidos de Hoje\n0" in t and "indisponíveis" not in t and "Falha ao consultar" not in t)
        await b.close()
        # V4/V5 pedido
        for mode in ("fail","ok"):
            be = Backend({"orders": []})
            if mode=="fail":
                be.post_handlers["orders"] = lambda body: (500, {"message":"falha simulada ao gravar"})
            else:
                def ok(body):
                    row = dict(body if isinstance(body, dict) else body[0]); row.update({"id":"11111111-2222-4333-8444-555555555555","created_at":NOW,"status":"pending"}); return (201, row)
                be.post_handlers["orders"] = ok
            b, page = await open_app(pw, be)
            await page.add_init_script("window.__receipts=[];const w=Document.prototype.write;Document.prototype.write=function(h){try{window.top.__receipts.push(h)}catch(e){};return w.call(this,h)};window.print=()=>{};HTMLIFrameElement.prototype.__p=1;")
            await page.goto("http://localhost:8080/login")
            await page.evaluate("localStorage.setItem('gasfacil:printer-settings', JSON.stringify({enabled:true, autoPrint:true}))")
            await page.goto("http://localhost:8080/orders"); await page.wait_for_timeout(3000)
            await page.get_by_role("button", name="Novo Pedido").click(); await page.wait_for_timeout(800)
            dlg = page.get_by_role("dialog")
            await dlg.get_by_placeholder("Nome do cliente").fill("Cliente Fictício")
            await dlg.get_by_placeholder("Somente números").fill("75999990000")
            await dlg.get_by_placeholder("Nome da rua").fill("Rua Fictícia")
            await dlg.get_by_placeholder("Número", exact=True).fill("10")
            await page.locator("#gasP13-toggle").click()
            await dlg.locator("input[type=number]").first.fill("1")
            await dlg.get_by_placeholder("Selecione a forma de pagamento").click() if False else None
            await dlg.locator("button[role=combobox]").last.click(); await page.wait_for_timeout(300)
            await page.get_by_role("option").first.click()
            await dlg.get_by_placeholder("0,00").fill("125")
            await page.screenshot(path=f"v4_{mode}_antes.png")
            await dlg.get_by_role("button", name="Cadastrar Pedido").click()
            await page.wait_for_timeout(900)
            toast_text = await text(page)
            await page.wait_for_timeout(1600)
            await page.screenshot(path=f"v4_{mode}_depois.png")
            t = await text(page)
            open_now = await page.get_by_role("dialog").count() > 0
            receipt = await page.evaluate("(window.__receipts||[]).join('\\n')")
            posted = [w for w in be.writes if w.get("table")=="orders"]
            if mode=="fail":
                check("V4 falha: houve tentativa de gravação", len(posted)==1)
                check("V4 falha: formulário continua aberto", open_now)
                nome = await page.get_by_placeholder("Nome do cliente").input_value() if open_now else ""
                check("V4 falha: dados preenchidos preservados", nome=="Cliente Fictício")
                check("V4 falha: sem recibo impresso", "Cliente Fictício" not in receipt)
                check("V4 falha: sem mensagem de sucesso e com aviso de erro", "registrado com sucesso" not in toast_text+t and "Erro ao adicionar pedido" in toast_text+t)
            else:
                check("V5 sucesso: formulário fechou", not open_now)
                check("V5 sucesso: mensagem de sucesso", "registrado com sucesso" in toast_text or "registrado com sucesso" in t)
                check("V5 recibo contém o ID persistido", "11111111" in receipt.upper() or "11111111-2222" in receipt, receipt[:200].replace("\n"," "))
            await b.close()
        # V6 zeros configurados
        be = Backend({"configuracoes_entrega":[{"id":"e1","organization_id":ORG,"taxa_entrega":0,"valor_min_entrega_gratis":0,"raio_maximo_km":0,"rastreamento_ativo":True}],
                      "configuracoes_financeiras":[{"id":"f1","organization_id":ORG,"moeda":"BRL","taxa_imposto":0,"metodos_pagamento":{}}],
                      "configuracoes_estoque":[{"id":"00000000-0000-4000-8000-0000000000s1".replace("s1","51"),"organization_id":ORG,"produto":"p13","estoque_minimo":0,"alerta_ativo":True,"destinatarios_alerta":[]}]})
        b, page = await open_app(pw, be)
        await page.goto("http://localhost:8080/settings"); await page.wait_for_timeout(2500)
        res = {}
        for tab in ("Entregas","Financeiro","Estoque"):
            await page.get_by_role("tab", name=tab).click(); await page.wait_for_timeout(1500)
            panel = page.get_by_role("tabpanel")
            vals = await panel.locator("input[type=number], input:not([type])").evaluate_all("els => els.map(e => e.value)")
            res[tab] = vals
            await page.screenshot(path=f"v6_{tab}.png")
        print("  valores:", res)
        check("V6 entregas: taxa/mínimo/raio zero permanecem 0", res["Entregas"][:3] and all(v in ("0","0.00","0,00") for v in res["Entregas"][:3]), str(res["Entregas"]))
        check("V6 financeiro: imposto zero permanece 0", any(v in ("0","0.00","0,00") for v in res["Financeiro"]), str(res["Financeiro"]))
        check("V6 estoque: mínimo P13 zero permanece 0 (demais sem registro usam padrão)", res["Estoque"][:1]==["0"], str(res["Estoque"]))
        be.post_handlers["configuracoes_estoque"] = lambda body: (200, dict(body if isinstance(body, dict) else body[0], id="x"))
        await page.get_by_role("tab", name="Estoque").click(); await page.wait_for_timeout(800)
        await page.get_by_role("button", name="Salvar Configurações").click(); await page.wait_for_timeout(2500)
        sw = [w for w in be.writes if w.get("table")=="configuracoes_estoque"]
        print("  gravações estoque:", [(w["method"], w["body"]) for w in sw][:4])
        p13w = [w for w in sw if isinstance(w["body"], dict) and w["body"].get("produto")=="p13"]
        check("V6 estoque: salvar mantém P13 = 0 e atualiza o registro existente (PATCH, sem id inventado)", p13w and p13w[0]["method"]=="PATCH" and p13w[0]["body"].get("estoque_minimo")==0 and "id" not in p13w[0]["body"])
        newer = [w for w in sw if w["method"]=="POST"]
        check("V6 estoque: produtos sem registro são inseridos sem id fixo", newer and all("id" not in w["body"] for w in newer))
        await b.close()
        # V7 cobradores
        be = Backend({"colaboradores":[{"id":"c1","nome":"Cobrador Fictício A","situacao":"ativo","organization_id":ORG,"cargo":"cobrador"},{"id":"c2","nome":"Cobrador Fictício B","situacao":"ativo","organization_id":ORG,"cargo":"entregador"}],
                      "promissory_notes":[{"id":"p1","organization_id":ORG,"client_name":"Cliente Fictício","value":50,"due_date":TODAY_LOCAL,"status":"pending","created_at":NOW,"updated_at":NOW}]})
        reqs = []
        b, page = await open_app(pw, be)
        page.on("request", lambda r: "colaboradores" in r.url and reqs.append((r.url, r.headers.get("authorization",""))))
        await page.goto("http://localhost:8080/promissory"); await page.wait_for_timeout(3000)
        await page.get_by_role("button", name="Nova Promissória").click(); await page.wait_for_timeout(800)
        await page.screenshot(path="v7_nova.png")
        await page.get_by_role("dialog").locator("button[role=combobox]").last.click(); await page.wait_for_timeout(500)
        found = await page.get_by_role("option").all_inner_texts()
        await page.screenshot(path="v7_opcoes.png")
        print("  opções cobrador:", found); print("  req:", [u for u,_ in reqs][:2])
        check("V7 cobradores = cadastros fictícios ativos", set(found) >= {"Cobrador Fictício A","Cobrador Fictício B"} and not any(n in " ".join(found) for n in ("João","Maria","Carlos","Pedro")), str(found))
        check("V7 consulta filtra situação ativo", any("situacao=eq.ativo" in u for u,_ in reqs))
        check("V7 consulta usa o token do usuário (RLS se aplica)", any(a.startswith("Bearer ") and a.split(" ")[1]==JWT for _,a in reqs))
        await b.close()
        # V8 fechamento parcial
        be = Backend({"orders": ORDERS, "movimentacoes_portaria":[{"id":"m1","organization_id":ORG,"tipo":"abertura","produto":"P13","delta_cheios":20,"delta_vazios":0,"delta_emprestados":0,"registrado_por":UID,"data_operacao":TODAY_LOCAL,"criado_em":NOW}]})
        captured = []
        def fech(body):
            captured.append(body); row = dict(body); row.update({"id":"f-1","created_at":NOW}); return (201, row)
        be.post_handlers["fechamentos_caixa"] = fech
        b, page = await open_app(pw, be)
        await page.goto("http://localhost:8080/entrance"); await page.wait_for_timeout(4000)
        await page.screenshot(path="v8_portaria.png")
        btn = page.get_by_role("button", name="Fechar Caixa")
        await btn.click(); await page.wait_for_timeout(2000)
        await page.screenshot(path="v8_dialog.png")
        await page.get_by_role("dialog").get_by_role("button", name="Confirmar Fechamento Parcial").click()
        await page.wait_for_timeout(4000)
        await page.screenshot(path="v8_depois.png")
        print("  writes:", [ (w.get("method"), w.get("table") or w.get("url")) for w in be.writes])
        p = captured[0] if captured else {}
        print("  payload:", {k:p.get(k) for k in ("tipo","total_vendas","total_dinheiro","total_pix","total_cartao","total_outros")})
        check("V8 parcial gravado com tipo partial", p.get("tipo")=="partial")
        check("V8 total = só entregues até o corte (375)", p.get("total_vendas")==375)
        check("V8 divisão por pagamento fiel (dinheiro 250, pix 125)", p.get("total_dinheiro")==250 and p.get("total_pix")==125)
        check("V8 soma das formas = total (sem duplicar)", (p.get("total_dinheiro",0)+p.get("total_pix",0)+p.get("total_cartao",0)+p.get("total_outros",0))==p.get("total_vendas"))
        others = [w for w in be.writes if w.get("table") not in ("fechamentos_caixa",)]
        check("V8 parcial não movimenta caixa/estoque (nenhuma outra escrita)", not others, str(others)[:200])
        await b.close()
    print("\nRESUMO", sum(1 for r in R if r[1]), "/", len(R))
    json.dump(R, open("results.json","w"), ensure_ascii=False, indent=1)
asyncio.run(main())
