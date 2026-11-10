"""Contenção com o 005 em vigor: pausar o app do entregador NÃO pode deixar carga, dívida ou recebimento
inconsistentes, nem reabrir gravação direta, isolamento ou inativos. Também cobre o retorno (desfazer):
ação atrasada do entregador não conclui de novo o que a portaria já concluiu, e venda da fila com a mesma
chave entra uma vez só. Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, dados fictícios.
Rode em banco recém-criado com reset_com005.sh. Uso: python3 run_contencao_005.py <URL>"""
import subprocess, sys, json, os
URL = sys.argv[1]
assert "127.0.0.1" in URL, "somente banco local descartável"
SQLDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "candidate", "sql")
U = {"adminA":"a0000000-0000-4000-8000-00000000000a","userA":"a0000000-0000-4000-8000-00000000000b",
     "inativoA":"a0000000-0000-4000-8000-00000000000c","entregadorA":"a0000000-0000-4000-8000-00000000000d",
     "adminB":"b0000000-0000-4000-8000-00000000000a"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
K1, K2, K3 = ("0a000000-0000-4000-8000-0000000006c1", "0a000000-0000-4000-8000-0000000006c2", "0a000000-0000-4000-8000-0000000006c3")
E = U["entregadorA"]
ENV = {k: v for k, v in os.environ.items() if not k.startswith("PG")}

def psql(sql, commit=False):
    script = f"BEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True, env=ENV)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:300]
def as_user(user):
    if user == "root": return "RESET ROLE;\n"
    claims = json.dumps({"sub": U[user], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"
def flow(steps, commit=False): return psql("".join(as_user(u) + s + ";\n" for u, s in steps), commit)
def out(steps, commit=False): r = flow(steps, commit); return r[1] if r[0] else "ERRO:" + r[2]
def err(steps, commit=False): r = flow(steps, commit); return "" if r[0] else r[2]
def arquivo(nome):
    p = subprocess.run(["psql", URL, "-XAq", "-1", "-v", "ON_ERROR_STOP=1", "-f", os.path.join(SQLDIR, nome)], capture_output=True, text=True, env=ENV)
    assert p.returncode == 0, p.stderr[:400]

ok = psql(f"""INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,vasilhames_entregues,vasilhames_recebidos) VALUES
 ('{K1}','{U['userA']}','{ORG_A}','Cliente Contenção Um','pending','recarga','P13',125,1,0,0),
 ('{K2}','{U['userA']}','{ORG_A}','Cliente Contenção Dois','pending','recarga','P13',125,1,0,0),
 ('{K3}','{U['userA']}','{ORG_A}','Cliente Contenção Três','pending','recarga','P13',125,1,0,0);""", commit=True)
assert ok[0], ok[2]

R = []
def check(cat, name, cond, detail=""):
    R.append((cat, name, bool(cond))); print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}" + (f"  -> {detail}" if not cond and detail else ""))

CARGA = f"(SELECT coalesce(sum(m.delta_cheios),0) FROM carga_movimentos m JOIN cargas c ON c.id=m.carga_id WHERE c.entregador_id='{E}' AND c.status='aberta')"
SAIDAS = "(SELECT count(*) FROM movimentacoes_portaria WHERE tipo='saida_carga')"
REC = "(SELECT count(*) FROM recebimentos)"
PROM = f"(SELECT count(*) FROM promissory_notes WHERE order_id IN ('{K1}','{K2}','{K3}'))"
RUA = "(SELECT count(*) FROM orders WHERE client_name='Rua Contenção Fictícia')"
estado = lambda: out([("root", f"SELECT {CARGA}||'/'||{SAIDAS}||'/'||{REC}||'/'||{PROM}||'/'||{RUA}")])
RUA_SQL = "SELECT entregador_venda_rua(NULL,'Rua Contenção Fictícia','(00) 00000-0000','P13',1,130,'money','recarga',1,1,NULL,'kk-ct-rua')"

# Situação antes da contenção: três entregas com o produto já na carga, duas aceitas, 1 a mais para venda na rua.
r = out([("userA", f"SELECT atribuir_entrega('{K1}','{E}',true,'kk-ct-a1')"), ("userA", f"SELECT atribuir_entrega('{K2}','{E}',true,'kk-ct-a2')"),
         ("userA", f"SELECT atribuir_entrega('{K3}','{E}',true,'kk-ct-a3')"), ("userA", f"SELECT carga_saida('{E}','P13',1,'kk-ct-cs')"),
         ("entregadorA", f"SELECT entregador_aceitar_entrega('{K1}')"), ("entregadorA", f"SELECT entregador_aceitar_entrega('{K2}')"),
         ("root", "SELECT 1")], commit=True)
check("preparo", "três entregas na carga e uma unidade extra para venda na rua", r == "1", r)
antes = estado(); check("preparo", "carga 4, portaria 4 saídas, nada recebido", antes == "4/4/0/0/0", antes)

arquivo("004_contencao.sql")
# ── Durante a contenção
check("contenção", "entregador não aceita entrega (ação pausada)", "permission denied" in err([("entregadorA", f"SELECT entregador_aceitar_entrega('{K3}')")]))
check("contenção", "entregador não conclui entrega (ação pausada)", "permission denied" in err([("entregadorA", f"SELECT entregador_concluir_entrega('{K1}','money',1,'concluir-entrega:{K1}')")]))
check("contenção", "entregador não vende na rua (ação pausada)", "permission denied" in err([("entregadorA", RUA_SQL)]))
check("contenção", "entregador não conclui por gravação direta", err([("entregadorA", f"UPDATE orders SET status='completed' WHERE id='{K1}' RETURNING id")]) != "" or
      out([("entregadorA", f"WITH u AS (UPDATE orders SET status='completed' WHERE id='{K1}' RETURNING 1) SELECT count(*) FROM u")]) == "0")
check("contenção", "entregador não grava venda direta", err([("entregadorA", f"INSERT INTO orders(user_id,organization_id,client_name,status,tipo_venda,product,price,quantity) VALUES ('{E}','{ORG_A}','Rua Contenção Fictícia','delivered','recarga','P13',130,1)")]) != "")
check("contenção", "entregador não grava promissória direta", err([("entregadorA", f"INSERT INTO promissory_notes(organization_id,client_name,value,due_date) VALUES ('{ORG_A}','Rua Contenção Fictícia',130,current_date+30)")]) != "")
check("contenção", "tentativas recusadas não deixaram rastro", estado() == antes, estado())

r = out([("userA", f"SELECT operador_concluir_entrega('{K1}','money',125,1,NULL,'kk-ct-op1')"),
         ("userA", f"SELECT operador_concluir_entrega('{K1}','money',125,1,NULL,'kk-ct-op1')"),
         ("root", f"SELECT (SELECT status FROM orders WHERE id='{K1}')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id='{K1}')||'/'||(SELECT sum(delta_cheios) FROM carga_movimentos WHERE order_id='{K1}')||'/'||{SAIDAS}")], commit=True)
check("contenção", "portaria conclui pelo entregador atribuído (repetido): 1 recebimento, carga do pedido zerada, portaria sem 2ª baixa", r == "completed/1/0/4", r)
r = out([("userA", f"SELECT operador_concluir_entrega('{K2}','promissoria',0,0,NULL,'kk-ct-op2')"),
         ("root", f"SELECT (SELECT status FROM orders WHERE id='{K2}')||'/'||(SELECT count(*)||':'||coalesce(sum(value),0) FROM promissory_notes WHERE order_id='{K2}')||'/'||(SELECT count(*) FROM recebimentos WHERE order_id='{K2}')")], commit=True)
check("contenção", "conclusão a prazo pela portaria gera a dívida (promissória 125) e nenhum recebimento", r == "completed/1:125.00/0", r)
check("contenção", "portaria continua sem concluir por gravação direta", "Conclusão só pela ação" in err([("userA", f"UPDATE orders SET status='delivered' WHERE id='{K3}'")]))
check("contenção", "forma de pagamento de venda concluída não muda por gravação direta", err([("adminA", f"UPDATE orders SET payment_method='pix' WHERE id='{K1}'")]) != "")
check("contenção", "promissória já quitada não nasce por gravação direta", err([("userA", f"INSERT INTO promissory_notes(organization_id,client_name,value,paid_amount,status,due_date) VALUES ('{ORG_A}','Direta Fictícia',100,100,'paid',current_date)")]) != "")
check("contenção", "isolamento entre empresas continua", out([("adminB", f"SELECT count(*) FROM orders WHERE id='{K1}'")]) == "0")
check("contenção", "conta inativa continua sem acesso", out([("inativoA", f"SELECT count(*) FROM orders WHERE id='{K1}'")]) in ("0",) or "ERRO" in out([("inativoA", "SELECT count(*) FROM orders")]))
r = estado(); check("contenção", "saldo: carga 2 (4 − 2 entregues), 4 saídas, 1 recebimento, 1 promissória, 0 venda na rua", r == "2/4/1/1/0", r)

arquivo("004_contencao_desfazer.sql")
# ── Volta do app do entregador
e = err([("entregadorA", f"SELECT entregador_concluir_entrega('{K1}','money',1,'concluir-entrega:{K1}')")])
check("desfazer", "conclusão atrasada do entregador não conclui de novo o que a portaria concluiu", e != "", e[:120])
e = err([("entregadorA", f"SELECT entregador_concluir_entrega('{K2}','money',0,'concluir-entrega:{K2}')")])
check("desfazer", "nem troca a dívida a prazo por dinheiro", e != "", e[:120])
r = out([("entregadorA", RUA_SQL), ("entregadorA", RUA_SQL), ("root", "SELECT 1")], commit=True)
check("desfazer", "venda guardada na fila, enviada duas vezes com a mesma chave", r == "1", r)
r = estado(); check("desfazer", "saldo: carga 1, 1 venda na rua, 2 recebimentos, 1 promissória", r == "1/4/2/1/1", r)
r = out([("entregadorA", f"SELECT entregador_aceitar_entrega('{K3}')"), ("root", f"SELECT status FROM orders WHERE id='{K3}'")], commit=True)
check("desfazer", "entregador volta a aceitar pela ação controlada", r == "delivering", r)

passed = sum(1 for *_, c in R if c)
print(f"\ncontenção 005: {passed}/{len(R)}")
json.dump([{"cat": c, "test": n, "ok": o} for c, n, o in R], open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "result_contencao_005.json"), "w"), ensure_ascii=False, indent=1)
sys.exit(0 if passed == len(R) else 1)
