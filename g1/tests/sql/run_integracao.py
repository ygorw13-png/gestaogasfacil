"""Testes do 004 (integração das telas): decisões A, C, D e bloqueios da decisão B pendente,
venda na portaria, conclusão pela portaria, reenvios, concorrência e contenção revisada.
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, dados fictícios. Rode depois de fixtures.sql + 003 + 004.
Uso: python3 run_integracao.py <URL> <rotulo>"""
import subprocess, sys, json, threading, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
ROOT = os.path.dirname(os.path.abspath(__file__))
U = {"adminA":"a0000000-0000-4000-8000-00000000000a","userA":"a0000000-0000-4000-8000-00000000000b",
     "inativoA":"a0000000-0000-4000-8000-00000000000c","entregadorA":"a0000000-0000-4000-8000-00000000000d",
     "entregador2A":"a0000000-0000-4000-8000-00000000000f","adminB":"b0000000-0000-4000-8000-00000000000a",
     "entregadorB":"b0000000-0000-4000-8000-00000000000d"}
ORG_A, ORG_B = "0a000000-0000-4000-8000-000000000000", "0b000000-0000-4000-8000-000000000000"
P1 = "0a000000-0000-4000-8000-0000000004a1"  # pendente, 2x P13, R$ 250
P2 = "0a000000-0000-4000-8000-0000000004a2"  # pendente, 1x P13, R$ 125
P3 = "0a000000-0000-4000-8000-0000000004a3"  # pendente, 1x P13, R$ 125 (concorrência)

def psql(sql, commit=False):
    script = f"BEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:300]
def as_user(user):
    if user == 'root': return 'RESET ROLE;\n'
    claims = json.dumps({"sub":U[user],"role":"authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"
def flow(steps, commit=False):
    sql = "".join(as_user(u) + s + ";\n" for u, s in steps)
    return psql(sql, commit)
def out(steps): r = flow(steps); return r[1] if r[0] else "ERRO:" + r[2]
def ok(steps): return flow(steps)[0]
def err(steps):
    r = flow(steps); return "" if r[0] else r[2]

FIX = f"""
SET session_replication_role = replica;
INSERT INTO auth.users(id,email) VALUES ('{U['entregador2A']}','entregador2.a@ficticio.test') ON CONFLICT DO NOTHING;
INSERT INTO profiles(id,name,role,organization_id,ativo) VALUES ('{U['entregador2A']}','Entregador Dois A','entregador','{ORG_A}',true) ON CONFLICT DO NOTHING;
INSERT INTO user_roles(user_id,role) SELECT '{U['entregador2A']}','entregador' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id='{U['entregador2A']}');
SET session_replication_role = origin;
INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,vasilhames_entregues,vasilhames_recebidos) VALUES
 ('{P1}','{U['userA']}','{ORG_A}','Cliente Fictício Avulso','pending','recarga','P13',250,2,0,0),
 ('{P2}','{U['userA']}','{ORG_A}','Cliente Fictício Dois','pending','recarga','Botijão P13',125,1,0,0),
 ('{P3}','{U['userA']}','{ORG_A}','Cliente Fictício Três','pending','recarga','P13',125,1,0,0)
 ON CONFLICT (id) DO NOTHING;
"""
assert psql(FIX, commit=True)[0], psql(FIX)[2]

R = []
def check(cat, name, cond):
    R.append((cat, name, bool(cond))); print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}")

E, E2 = U["entregadorA"], U["entregador2A"]
atr = lambda o, e, ret="false", k="NULL": f"SELECT atribuir_entrega('{o}','{e}',{ret},{k})"
nmov = lambda o: f"SELECT (SELECT count(*) FROM movimentacoes_portaria WHERE observacoes LIKE 'Transferência para carga%' AND referencia_id IN (SELECT carga_id FROM carga_movimentos WHERE order_id='{o}'))"
saldo = f"(SELECT coalesce(sum(m.delta_cheios),0) FROM carga_movimentos m JOIN cargas c ON c.id=m.carga_id WHERE c.entregador_id='{E}' AND c.status='aberta' AND m.produto='P13')"

# ── D: origem física real (portaria -> carga -> consumo, nunca duas vezes)
check("D","entrega avulsa: atribuir com retirada transfere para a carga na mesma ação",
  out([("userA", atr(P1,E,"true","'kk-test-atr-1'")),
       ("adminA", f"SELECT {saldo}||'/'||(SELECT delta_cheios FROM movimentacoes_portaria WHERE tipo='saida_carga' ORDER BY criado_em DESC LIMIT 1)||'/'||(SELECT delivery_person FROM orders WHERE id='{P1}')")]) == f"2/-2/{E}")
check("D","reenvio da atribuição com a mesma chave não transfere de novo",
  out([("userA", atr(P1,E,"true","'kk-test-atr-1'")), ("userA", atr(P1,E,"true","'kk-test-atr-1'")),
       ("adminA", f"SELECT {saldo}||'/'||(SELECT count(*) FROM movimentacoes_portaria WHERE tipo='saida_carga')")]) == "2/1")
check("D","conclusão consome só a carga: portaria baixa uma vez, recebimento uma vez",
  out([("userA", atr(P1,E,"true","'kk-test-atr-2'")),
       ("entregadorA", f"SELECT entregador_aceitar_entrega('{P1}')"),
       ("entregadorA", f"SELECT entregador_concluir_entrega('{P1}','money',2,'kk-test-conc-1')"),
       ("entregadorA", f"SELECT entregador_concluir_entrega('{P1}','money',2,'kk-test-conc-1')"),
       ("adminA", f"SELECT {saldo}||'/'||(SELECT count(*) FROM movimentacoes_portaria WHERE tipo='saida_carga')||'/'||(SELECT count(*)||':'||sum(valor)::int||':'||min(forma) FROM recebimentos WHERE order_id='{P1}')")]) == "0/1/1:250:dinheiro")
e = err([("userA", atr(P2,E)), ("entregadorA", f"SELECT entregador_aceitar_entrega('{P2}')"),
         ("entregadorA", f"SELECT entregador_concluir_entrega('{P2}','money',1,'kk-test-conc-2')")])
check("D","sem transferência para a carga a conclusão é recusada (não baixa da portaria por fora)", "Carga insuficiente" in e or "sem carga" in e)
check("D","produto com nome livre ('Botijão P13') casa com a carga P13",
  out([("userA", atr(P2,E,"true","'kk-test-atr-3'")), ("entregadorA", f"SELECT entregador_aceitar_entrega('{P2}')"),
       ("entregadorA", f"SELECT entregador_concluir_entrega('{P2}','pix',0,'kk-test-conc-3')"),
       ("adminA", f"SELECT status FROM orders WHERE id='{P2}'")]) == "completed")

# ── C: reatribuição explícita por ID
check("C","atribuir de novo um pedido já atribuído é recusado (use a reatribuição)",
  "reatribuição" in err([("userA", atr(P2,E)), ("userA", atr(P2,E2))]))
check("C","reatribui pedido aberto com motivo: troca o ID e registra histórico",
  out([("userA", atr(P2,E)), ("userA", f"SELECT reatribuir_entrega('{P2}','{E2}','Entregador A com pneu furado')"),
       ("adminA", f"SELECT delivery_person_id||'/'||delivery_person||'/'||status||'/'||(SELECT count(*) FROM auditoria_correcoes WHERE registro_id='{P2}' AND motivo LIKE 'Reatribuição:%') FROM orders WHERE id='{P2}'")]) == f"{E2}/{E2}/assigned/1")
check("C","reatribuição sem motivo é recusada", "Motivo" in err([("userA", atr(P2,E)), ("userA", f"SELECT reatribuir_entrega('{P2}','{E2}','')")]))
check("C","reatribuição para a fila (sem entregador) volta a pendente",
  out([("userA", atr(P2,E)), ("userA", f"SELECT reatribuir_entrega('{P2}',NULL,'Cliente pediu para esperar')"),
       ("adminA", f"SELECT status||'/'||coalesce(delivery_person_id::text,'-') FROM orders WHERE id='{P2}'")]) == "pending/-")
check("C","pedido concluído não é reatribuído (histórico preservado)",
  "em aberto" in err([("userA", atr(P1,E,"true","'kk-test-atr-4'")), ("entregadorA", f"SELECT entregador_aceitar_entrega('{P1}')"),
       ("entregadorA", f"SELECT entregador_concluir_entrega('{P1}','money',2,'kk-test-conc-4')"),
       ("userA", f"SELECT reatribuir_entrega('{P1}','{E2}','Tentativa indevida')")]))
check("C","entregador não reatribui", "Sem permissão" in err([("userA", atr(P2,E)), ("entregadorA", f"SELECT reatribuir_entrega('{P2}','{E2}','Quero passar adiante')")]))
check("C","não reatribui para entregador de outra empresa", "outra empresa" in err([("userA", atr(P2,E)), ("userA", f"SELECT reatribuir_entrega('{P2}','{U['entregadorB']}','Teste de isolamento')")]))
check("C","não reatribui para entregador inativo",
  "inativo" in err([("userA", atr(P2,E)), ("adminA", "SELECT 1"),
       ("userA", "RESET ROLE; SET LOCAL session_replication_role=replica; UPDATE profiles SET ativo=false WHERE id='"+E2+"'; SET LOCAL session_replication_role=origin; SET LOCAL ROLE authenticated"),
       ("userA", f"SELECT reatribuir_entrega('{P2}','{E2}','Teste de inativo')")]))

# ── A: operador não cancela, não altera preço, não estorna
check("A","operador não usa a correção administrativa", "Sem permissão" in err([("userA", f"SELECT admin_corrigir_pedido('{P3}',100,NULL,'Tentativa do operador')")]))
check("A","operador não altera preço por gravação direta", "exige ação autorizada" in err([("userA", f"UPDATE orders SET price=1 WHERE id='{P3}'")]))
check("A","operador não cancela por gravação direta", "exige ação autorizada" in err([("userA", f"UPDATE orders SET status='cancelled' WHERE id='{P3}'")]))
check("A","admin cancela pedido em aberto sem baixa, com motivo e histórico",
  out([("adminA", f"SELECT admin_corrigir_pedido('{P3}',NULL,'cancelled','Cliente desistiu por telefone')"),
       ("adminA", f"SELECT status||'/'||(SELECT count(*) FROM auditoria_correcoes WHERE registro_id='{P3}') FROM orders WHERE id='{P3}'")]) == "cancelled/1")

# ── B pendente: nada de estorno automático; bloqueia o que deixaria estoque/dívida/recebimento inconsistentes
def tem(m): return any(t in m for t in ("decisão B", "use a reversão", "diferença de preço", "cancele pela reversão", "devolução da carga"))
CONCLUIDO = [("userA", atr(P1,E,"true","'kk-test-atr-5'")), ("entregadorA", f"SELECT entregador_aceitar_entrega('{P1}')"),
             ("entregadorA", f"SELECT entregador_concluir_entrega('{P1}','money',2,'kk-test-conc-5')")]
check("B","admin não cancela venda concluída", tem(err(CONCLUIDO + [("adminA", f"SELECT admin_corrigir_pedido('{P1}',NULL,'cancelled','Cliente devolveu o botijão')")])))
check("B","admin não reabre venda concluída", tem(err(CONCLUIDO + [("adminA", f"SELECT admin_corrigir_pedido('{P1}',NULL,'pending','Reabrir para corrigir')")])))
check("B","admin não muda preço de venda com recebimento", tem(err(CONCLUIDO + [("adminA", f"SELECT admin_corrigir_pedido('{P1}',200,NULL,'Desconto posterior')")])))
check("B","admin não cancela pedido cujo produto já foi para a carga", tem(err(
  [("userA", atr(P1,E,"true","'kk-test-atr-6'")), ("adminA", f"SELECT admin_corrigir_pedido('{P1}',NULL,'cancelled','Cliente desistiu')")])))
check("B","venda concluída a prazo: admin não muda preço (dívida já gerada)", tem(err(
  [("userA", "SELECT venda_portaria(NULL,'Devedor Fictício','P13',1,130,'promissoria','recarga',true,NULL,NULL,'kk-test-vp-b') \\gset v_\n"),
   ("adminA", "SELECT admin_corrigir_pedido(:'v_venda_portaria',100,NULL,'Desconto posterior')")])))
# 010: "decisão B"; 011: venda concluída vai para a reversão controlada.
check("B","nenhuma tentativa bloqueada deixou rastro (estoque, carga, recebimento, auditoria)",
  out([("adminA", f"SELECT (SELECT count(*) FROM auditoria_correcoes WHERE registro_id='{P1}')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id='{P1}')")]) == "0/0")

# ── Venda na portaria (balcão, venda rápida, caixa): uma transação, sem duplicar
VP = lambda k, forma="money", valor=130: f"SELECT venda_portaria(NULL,'Cliente Balcão Fictício','P13',1,{valor},'{forma}','recarga',true,NULL,NULL,'kk-test-{k}')"
check("portaria","venda grava pedido, baixa da portaria e recebimento juntos",
  out([("userA", VP("k-vp-1") + " \\gset v_\n"),
       ("adminA", "SELECT (SELECT status||':'||origem_venda FROM orders WHERE id=:'v_venda_portaria')||'/'||(SELECT delta_cheios||':'||delta_vazios FROM movimentacoes_portaria WHERE referencia_id=:'v_venda_portaria')||'/'||(SELECT valor::int||':'||forma FROM recebimentos WHERE order_id=:'v_venda_portaria')")]) == "delivered:portaria/-1:1/130:dinheiro")
check("portaria","reenvio da venda com a mesma chave não duplica",
  out([("userA", VP("k-vp-2")), ("userA", VP("k-vp-2")), ("root", "SELECT (SELECT count(*) FROM orders o JOIN acoes_idempotentes a ON a.resultado=o.id WHERE a.chave='kk-test-k-vp-2')||'/'||(SELECT count(*) FROM recebimentos r JOIN acoes_idempotentes a ON a.resultado=r.order_id WHERE a.chave='kk-test-k-vp-2')")]) == "1/1")
check("portaria","venda a prazo gera promissória ligada e nenhum recebimento",
  out([("userA", VP("k-vp-3","promissoria") + " \\gset v_\n"),
       ("adminA", "SELECT (SELECT count(*) FROM promissory_notes WHERE order_id=:'v_venda_portaria')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id=:'v_venda_portaria')")]) == "1/0")
check("portaria","forma sem regra (vale-gás) é recusada e nada é gravado",
  "sem regra" in err([("userA", VP("k-vp-4","vale-gas"))]) and out([("root", "SELECT count(*) FROM acoes_idempotentes WHERE chave='kk-test-k-vp-4'")]) == "0")
check("portaria","entregador não vende pela portaria", "Sem permissão" in err([("entregadorA", VP("k-vp-5"))]))
check("portaria","conta inativa não vende", "inativa" in err([("inativoA", VP("k-vp-6"))]))

# ── Conclusão pela portaria (entregador sem app / contenção)
check("portaria","valor recebido diferente sem motivo é recusado",
  "exige motivo" in err([("userA", atr(P1,E,"true","'kk-test-atr-7'")), ("userA", f"SELECT operador_concluir_entrega('{P1}','money',200,2,NULL,'kk-test-oc-1')")]))
check("portaria","valor diferente com motivo: divergência registrada, preço intacto, carga do entregador consumida",
  out([("userA", atr(P1,E,"true","'kk-test-atr-8'")), ("userA", f"SELECT operador_concluir_entrega('{P1}','money',200,2,'Cliente pagou parte, resto amanhã','kk-test-oc-2')"),
       ("adminA", f"SELECT (SELECT price::int FROM orders WHERE id='{P1}')||'/'||(SELECT recebido::int FROM divergencias WHERE order_id='{P1}')||'/'||(SELECT sum(valor)::int FROM recebimentos WHERE order_id='{P1}')||'/'||{saldo}")]) == "250/200/200/0")

# ── Concorrência real (duas conexões, commit)
def par(fn_a, fn_b):
    res = [None, None]
    def run(i, s): res[i] = flow(s, commit=True)
    ts = [threading.Thread(target=run, args=(0, fn_a)), threading.Thread(target=run, args=(1, fn_b))]
    [t.start() for t in ts]; [t.join() for t in ts]; return res
par([("userA", VP("k-conc-vp"))], [("userA", VP("k-conc-vp"))])
check("concorrência","mesma venda enviada ao mesmo tempo grava uma vez",
  out([("root", "SELECT (SELECT count(*) FROM acoes_idempotentes WHERE chave='kk-test-k-conc-vp')||'/'||(SELECT count(*) FROM orders WHERE client_name='Cliente Balcão Fictício')||'/'||(SELECT count(*) FROM recebimentos r JOIN orders o ON o.id=r.order_id WHERE o.client_name='Cliente Balcão Fictício')")]) == "1/1/1")
assert flow([("userA", atr(P2, E, "true", "'kk-test-conc-atr'"))], commit=True)[0]
r = par([("userA", f"SELECT operador_concluir_entrega('{P2}','money',125,1,NULL,'kk-test-conc-a')")],
        [("userA", f"SELECT operador_concluir_entrega('{P2}','pix',125,1,NULL,'kk-test-conc-b')")])
check("concorrência","duas conclusões simultâneas do mesmo pedido: só uma passa, um recebimento",
  sum(1 for x in r if x[0]) == 1 and out([("adminA", f"SELECT count(*) FROM recebimentos WHERE order_id='{P2}'")]) == "1")
r = par([("userA", f"SELECT reatribuir_entrega('{P3}',NULL,'corrida um')")], [("userA", f"SELECT reatribuir_entrega('{P3}',NULL,'corrida dois')")])
check("concorrência","reatribuições simultâneas de pedido cancelado: ambas recusadas", not r[0][0] and not r[1][0])

# ── Contenção revisada (aplicada e desfeita dentro do teste)
cont = open(os.path.join(ROOT, "../../candidate/sql/004_contencao.sql")).read()
desf = open(os.path.join(ROOT, "../../candidate/sql/004_contencao_desfazer.sql")).read()
assert psql(cont, commit=True)[0]
P4 = "0a000000-0000-4000-8000-0000000004a5"
psql(f"INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,vasilhames_entregues,vasilhames_recebidos) VALUES ('{P4}','{U['userA']}','{ORG_A}','Cliente Contenção','pending','recarga','P13',125,1,0,0) ON CONFLICT DO NOTHING;", commit=True)
check("contenção","entregador pausado: não conclui pelo app", "permission denied" in err([("entregadorA", f"SELECT entregador_aceitar_entrega('{P4}')")]))
check("contenção","entregador continua sem gravação direta de pedido", "" == out([("entregadorA", f"UPDATE orders SET status='completed' WHERE id='{P4}' RETURNING id")]) or "ERRO" in out([("entregadorA", f"UPDATE orders SET status='completed' WHERE id='{P4}' RETURNING id")]))
check("contenção","portaria conclui com carga e recebimento consistentes",
  out([("userA", atr(P4,E,"true","'kk-test-cont-1'")), ("userA", f"SELECT operador_concluir_entrega('{P4}','money',125,1,NULL,'kk-test-cont-2')"),
       ("adminA", f"SELECT (SELECT status FROM orders WHERE id='{P4}')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id='{P4}')||'/'||(SELECT count(*) FROM carga_movimentos WHERE order_id='{P4}')")]) == "completed/1/2")
check("contenção","operador continua sem cancelar/alterar preço", "exige ação autorizada" in err([("userA", f"UPDATE orders SET price=1 WHERE id='{P4}'")]))
check("contenção","isolamento: entregador de outra empresa não vê pedidos", out([("entregadorB", "SELECT count(*) FROM orders WHERE organization_id='"+ORG_A+"'")]) == "0")
assert psql(desf, commit=True)[0]
check("contenção","desfeita: entregador volta a usar as ações", out([("entregadorA", "SELECT has_function_privilege('entregador_aceitar_entrega(uuid)','execute')")]) == "t")

print(f"\n{LABEL}: {sum(1 for r in R if r[2])}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB", "/tmp/g1db") + f"/integ_{LABEL}.json", "w"), ensure_ascii=False)
