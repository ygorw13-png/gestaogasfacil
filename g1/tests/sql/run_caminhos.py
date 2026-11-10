"""Testes do 005 (caminhos de gravação direta): o que contornava carga, dívida e recebimento passa a ser
recusado sem deixar rastro, e o que é legítimo continua funcionando. Banco PostgreSQL DESCARTÁVEL em 127.0.0.1,
dados fictícios. Rode em banco recém-criado com reset_com005.sh. Uso: python3 run_caminhos.py <URL> <rotulo>"""
import subprocess, sys, json, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
ROOT = os.path.dirname(os.path.abspath(__file__))
U = {"adminA":"a0000000-0000-4000-8000-00000000000a","userA":"a0000000-0000-4000-8000-00000000000b",
     "entregadorA":"a0000000-0000-4000-8000-00000000000d","entregador2A":"a0000000-0000-4000-8000-00000000000f"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
Q1, Q2, Q3 = ("0a000000-0000-4000-8000-0000000005c1", "0a000000-0000-4000-8000-0000000005c2", "0a000000-0000-4000-8000-0000000005c3")

def psql(sql, commit=False):
    script = f"BEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True,
                       env={k: v for k, v in os.environ.items() if not k.startswith("PG")})
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:300]
def as_user(user):
    if user == "root": return "RESET ROLE;\n"
    claims = json.dumps({"sub": U[user], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"
def flow(steps, commit=False): return psql("".join(as_user(u) + s + ";\n" for u, s in steps), commit)
def out(steps): r = flow(steps); return r[1] if r[0] else "ERRO:" + r[2]
def err(steps): r = flow(steps); return "" if r[0] else r[2]

FIX = f"""
SET session_replication_role = replica;
INSERT INTO auth.users(id,email) VALUES ('{U['entregador2A']}','entregador2.a@ficticio.test') ON CONFLICT DO NOTHING;
INSERT INTO profiles(id,name,role,organization_id,ativo) VALUES ('{U['entregador2A']}','Entregador Dois A','entregador','{ORG_A}',true) ON CONFLICT DO NOTHING;
INSERT INTO user_roles(user_id,role) SELECT '{U['entregador2A']}','entregador' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id='{U['entregador2A']}');
SET session_replication_role = origin;
INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,vasilhames_entregues,vasilhames_recebidos) VALUES
 ('{Q1}','{U['userA']}','{ORG_A}','Cliente Caminho Um','pending','recarga','P13',125,1,0,0),
 ('{Q2}','{U['userA']}','{ORG_A}','Cliente Caminho Dois','pending','recarga','P13',125,1,0,0),
 ('{Q3}','{U['userA']}','{ORG_A}','Cliente Caminho Três','pending','recarga','P13',125,1,0,0) ON CONFLICT (id) DO NOTHING;
"""
ok_fix = psql(FIX, commit=True); assert ok_fix[0], ok_fix[2]

R = []
def check(cat, name, cond):
    R.append((cat, name, bool(cond))); print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}")

E, E2 = U["entregadorA"], U["entregador2A"]
INS = lambda extra_cols, extra_vals: (f"INSERT INTO orders(user_id,organization_id,client_name,tipo_venda,product,price,quantity{extra_cols}) "
                                       f"VALUES ('{U['userA']}','{ORG_A}','Direto Fictício','recarga','P13',125,1{extra_vals})")
VP = lambda k, forma="money": f"SELECT venda_portaria(NULL,'Cliente Balcão Fictício','P13',1,130,'{forma}','recarga',true,NULL,NULL,'kk-cam-{k}')"
rastro = lambda: out([("root", "SELECT (SELECT count(*) FROM orders WHERE client_name='Direto Fictício')||'/'||(SELECT count(*) FROM recebimentos)||'/'||(SELECT count(*) FROM promissory_notes WHERE client_name LIKE 'Direta%')")])
base_rastro = rastro()

# ── H1 venda concluída por inserção direta
check("H1", "operador não insere venda já entregue", "Venda concluída só pela ação" in err([("userA", INS(",status", ",'delivered'"))]))
check("H1", "operador não insere venda já concluída", "Venda concluída só pela ação" in err([("userA", INS(",status", ",'completed'"))]))
check("H1", "administrador também não (vende pela ação)", "Venda concluída só pela ação" in err([("adminA", INS(",status", ",'delivered'"))]))
check("H1", "pedido novo não nasce com entregador (C)", "entregador só pela ação" in err([("userA", INS(",delivery_person_id,delivery_person", f",'{E}','{E}'"))]))
check("H1", "pedido novo não nasce atribuído", "entregador só pela ação" in err([("userA", INS(",status", ",'assigned'"))]))
check("H1", "continua: pedido novo na fila por gravação direta (formulário de pedido)", out([("userA", INS("", "") + " RETURNING status")]) == "pending")

# ── H2 conclusão por atualização direta
for st in ("delivered", "completed"):
    check("H2", f"operador não conclui por gravação direta ({st})", "Conclusão só pela ação" in err([("userA", f"UPDATE orders SET status='{st}' WHERE id='{Q1}'")]))
check("H2", "administrador também não conclui por gravação direta", "Conclusão só pela ação" in err([("adminA", f"UPDATE orders SET status='delivered' WHERE id='{Q1}'")]))
check("H2", "pedido atribuído com carga não conclui por gravação direta",
  "Conclusão só pela ação" in err([("userA", f"SELECT atribuir_entrega('{Q1}','{E}',true,'kk-cam-a1')"), ("userA", f"UPDATE orders SET status='completed' WHERE id='{Q1}'")]))
check("H2", "continua: conclusão pela ação consome a carga e registra o recebimento",
  out([("userA", f"SELECT atribuir_entrega('{Q1}','{E}',true,'kk-cam-a2')"),
       ("userA", f"SELECT operador_concluir_entrega('{Q1}','money',125,0,NULL,'kk-cam-c2')"),
       ("adminA", f"SELECT (SELECT status FROM orders WHERE id='{Q1}')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id='{Q1}')||'/'||(SELECT sum(delta_cheios) FROM carga_movimentos WHERE order_id='{Q1}')")]) == "completed/1/0")

# ── H3 atribuição / troca / devolução por atualização direta (C)
check("H3", "operador não atribui por gravação direta", "atribuição/reatribuição" in err([("userA", f"UPDATE orders SET status='assigned', delivery_person_id='{E}', delivery_person='{E}' WHERE id='{Q2}'")]))
check("H3", "operador não atribui pelo nome", "atribuição/reatribuição" in err([("userA", f"UPDATE orders SET delivery_person='Entregador A' WHERE id='{Q2}'")]))
check("H3", "operador não troca o entregador por gravação direta",
  "atribuição/reatribuição" in err([("userA", f"SELECT atribuir_entrega('{Q2}','{E}')"), ("userA", f"UPDATE orders SET delivery_person_id='{E2}', delivery_person='{E2}' WHERE id='{Q2}'")]))
check("H3", "operador não devolve à fila por gravação direta",
  "atribuição/reatribuição" in err([("userA", f"SELECT atribuir_entrega('{Q2}','{E}')"), ("userA", f"UPDATE orders SET status='pending', delivery_person=NULL, delivery_person_id=NULL WHERE id='{Q2}'")]))
check("H3", "pedido na fila não vai direto para 'em entrega'", "atribuição/reatribuição" in err([("userA", f"UPDATE orders SET status='delivering' WHERE id='{Q2}'")]))
check("H3", "continua: troca pela reatribuição com motivo, registrada no histórico",
  out([("userA", f"SELECT atribuir_entrega('{Q2}','{E}')"), ("userA", f"SELECT reatribuir_entrega('{Q2}','{E2}','Entregador A com pneu furado')"),
       ("adminA", f"SELECT (SELECT delivery_person_id FROM orders WHERE id='{Q2}')||'/'||(SELECT count(*) FROM auditoria_correcoes WHERE registro_id='{Q2}')")]) == f"{E2}/1")
check("H3", "continua: atribuído -> em entrega e endereço/observação editáveis",
  out([("userA", f"SELECT atribuir_entrega('{Q2}','{E}')"), ("userA", f"UPDATE orders SET status='delivering', notes='Portão azul', address='{{\"street\":\"Rua Fictícia\"}}' WHERE id='{Q2}' RETURNING status")]) == "delivering")

# ── H4 promissória por inserção direta
PN = lambda cols, vals: (f"INSERT INTO promissory_notes(organization_id,client_name,value,due_date{cols}) "
                         f"VALUES ('{ORG_A}','Direta Fictícia',90,current_date+30{vals})")
check("H4", "operador não cria promissória já paga", "nasce em aberto" in err([("userA", PN(",status,paid_amount,paid_at", ",'paid',90,now()"))]))
check("H4", "operador não cria promissória com pagamento parcial", "nasce em aberto" in err([("userA", PN(",status,paid_amount", ",'parcial',30"))]))
check("H4", "operador não cria promissória com valor pago escondido", "nasce em aberto" in err([("userA", PN(",paid_amount", ",10"))]))
check("H4", "operador não liga promissória a uma venda por fora", "só pela ação da venda" in err([("userA", PN(",order_id", f",'{Q3}'"))]))
check("H4", "promissória sem valor é recusada", "inválido" in err([("userA", f"INSERT INTO promissory_notes(organization_id,client_name,value,due_date) VALUES ('{ORG_A}','Direta Fictícia',0,current_date)")]))
check("H4", "continua: dívida avulsa em aberto, com ou sem cobrador",
  out([("userA", PN("", "")), ("userA", PN(",status,assigned_to", ",'assigned','Cobrador A'")), ("adminA", "SELECT count(*) FROM promissory_notes WHERE client_name='Direta Fictícia'")]) == "2")
check("H4", "continua: venda a prazo pela portaria gera promissória ligada, sem recebimento",
  out([("userA", VP("p1", "promissoria") + " \\gset v_\n"),
       ("adminA", "SELECT (SELECT count(*)||':'||min(status) FROM promissory_notes WHERE order_id=:'v_venda_portaria')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id=:'v_venda_portaria')")]) == "1:pending/0")
check("H4", "continua: recebimento parcial pela ação", out([("userA", PN("", "") + " RETURNING id \\gset p_\n"), ("userA", "SELECT receber_promissoria(:'p_id',40,'pix','kk-cam-r1')"),
       ("adminA", "SELECT status||'/'||paid_amount::int FROM promissory_notes WHERE id=:'p_id'")]) == "parcial/40")

# ── H5 venda concluída alterada por gravação direta
V = [("userA", VP("v1") + " \\gset v_\n")]
for col, val in (("payment_method", "'pix'"), ("product", "'P45'"), ("tipo_venda", "'completo'"), ("client_name", "'Outro Cliente'"),
                 ("vasilhames_recebidos", "0"), ("delivered_at", "now() - interval '3 days'")):
    check("H5", f"venda concluída: {col} não muda por gravação direta", "decisão B" in err(V + [("userA", f"UPDATE orders SET {col}={val} WHERE id=:'v_venda_portaria'")]))
check("H5", "administrador também não muda por gravação direta", "decisão B" in err(V + [("adminA", "UPDATE orders SET payment_method='pix' WHERE id=:'v_venda_portaria'")]))
check("H5", "continua: observação de venda concluída editável", out(V + [("userA", "UPDATE orders SET notes='Cliente pediu nota' WHERE id=:'v_venda_portaria' RETURNING notes")]) == "Cliente pediu nota")
check("H5", "produto já na carga não troca por gravação direta",
  "carga não muda" in err([("userA", f"SELECT atribuir_entrega('{Q3}','{E}',true,'kk-cam-a3')"), ("userA", f"UPDATE orders SET product='P45' WHERE id='{Q3}'")]))

# ── H6 baixa de estoque por venda direta na portaria
MOV = lambda t: f"SELECT registrar_movimentacao_portaria('{t}','P13',-1,1,0)"
check("H6", "operador não registra baixa 'venda' direto na portaria", "só pela ação de venda" in err([("userA", MOV("venda"))]))
check("H6", "operador não registra baixa 'venda_comodato' direto", "só pela ação de venda" in err([("userA", MOV("venda_comodato"))]))
check("H6", "continua: ajuste de estoque com movimento próprio", out([("userA", "SELECT registrar_movimentacao_portaria('ajuste','P13',1,0,0) IS NOT NULL")]) == "t")

# ── Contexto controlado não vaza para gravações diretas na mesma transação
check("contexto", "depois de venda a prazo na mesma transação, gravação direta continua recusada",
  "Conclusão só pela ação" in err([("userA", VP("x1", "promissoria")), ("userA", f"UPDATE orders SET status='delivered' WHERE id='{Q3}'")]))
check("contexto", "depois de conclusão pela ação, inserção de venda concluída continua recusada",
  "Venda concluída só pela ação" in err([("userA", f"SELECT atribuir_entrega('{Q3}','{E}',true,'kk-cam-x2')"),
                                         ("userA", f"SELECT operador_concluir_entrega('{Q3}','promissoria',NULL,0,NULL,'kk-cam-x3')"),
                                         ("userA", INS(",status", ",'delivered'"))]))
check("contexto", "depois de venda na rua a prazo, promissória paga direta continua recusada",
  "nasce em aberto" in err([("userA", f"SELECT atribuir_entrega('{Q3}','{E}',true,'kk-cam-x4')"),
     ("entregadorA", "SELECT entregador_venda_rua(NULL,'Rua Fictícia',NULL,'P13',1,125,'promissoria','recarga',0,1,NULL,'kk-cam-x5')"),
     ("userA", PN(",status,paid_amount,paid_at", ",'paid',90,now()"))]))
check("contexto", "função interna de pagamento não é exposta", "permission denied" in err([("userA", f"SELECT _registrar_pagamento('{ORG_A}',NULL,'venda','money',10,NULL,'x')")]))

check("rastro", "nenhuma tentativa recusada deixou pedido, recebimento ou promissória", rastro() == base_rastro)

ok = sum(1 for r in R if r[2]); print(f"\n{LABEL}: {ok}/{len(R)}")
json.dump([{"cat": c, "test": n, "ok": o} for c, n, o in R], open(os.path.join(ROOT, f"result_caminhos_{LABEL}.json"), "w"), ensure_ascii=False, indent=1)
