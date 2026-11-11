"""Testes do 006 (saldo da portaria na transferência para a carga + data operacional America/Bahia).
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, dados fictícios. Rode depois de reset_com006.sh.
Uso: python3 run_portaria006.py <URL> <rotulo>
Cada verificação roda em transação própria desfeita, exceto o bloco de concorrência (confirma).
A sessão usa TimeZone=UTC, como no Cloud, para que CURRENT_DATE e a data operacional possam divergir."""
import subprocess, sys, json, threading, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "inativoA": "a0000000-0000-4000-8000-00000000000c", "entregadorA": "a0000000-0000-4000-8000-00000000000d",
     "adminB": "b0000000-0000-4000-8000-00000000000a", "entregadorB": "b0000000-0000-4000-8000-00000000000d"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
E = U["entregadorA"]
PED = "0a000000-0000-4000-8000-0000000006a1"


def psql(sql, commit=False):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:400]


def as_user(user):
    if user == "root":
        return "RESET ROLE;\n"
    claims = json.dumps({"sub": U[user], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"


def flow(steps, commit=False):
    return psql("".join(as_user(u) + s + ";\n" for u, s in steps), commit)


def out(steps):
    r = flow(steps)
    return r[1] if r[0] else "ERRO:" + r[2]


def err(steps):
    r = flow(steps)
    return "" if r[0] else r[2]


R = []


def check(cat, name, cond):
    R.append((cat, name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}")


def tentar(sql):
    return f"DO $t$ BEGIN BEGIN PERFORM ({sql.replace('SELECT ', '', 1)}); EXCEPTION WHEN others THEN NULL; END; END $t$"


ABRE = lambda q=10, p="P13": ("userA", f"SELECT registrar_movimentacao_portaria('abertura','{p}',{q},0,0)")
SAIDA = lambda q, k, ent=E, p="P13", who="userA": (who, f"SELECT carga_saida('{ent}','{p}',{q},'{k}')")
SALDO = ("root", f"SELECT _saldo_portaria_cheios('{ORG_A}','P13',data_operacional())")
CARGA = ("root", f"SELECT coalesce(sum(m.delta_cheios),0) FROM carga_movimentos m JOIN cargas c ON c.id=m.carga_id WHERE c.entregador_id='{E}' AND c.status='aberta' AND m.produto='P13'")
RASTRO = ("root", "SELECT (SELECT count(*) FROM movimentacoes_portaria WHERE tipo='saida_carga')||'/'||(SELECT count(*) FROM carga_movimentos WHERE tipo='saida_portaria')")

# ── data operacional
check("data", "data operacional = data civil em America/Bahia, independente do fuso da sessão",
      out([("root", "SELECT data_operacional() = (now() AT TIME ZONE 'America/Bahia')::date")]) == "t"
      and out([("root", "SET LOCAL TimeZone='Asia/Tokyo'; SELECT data_operacional() = (now() AT TIME ZONE 'America/Bahia')::date")]) == "t")
check("data", "movimento sem data informada grava a data operacional (não CURRENT_DATE da sessão)",
      out([ABRE(), ("root", "SELECT data_operacao = data_operacional() FROM movimentacoes_portaria WHERE tipo='abertura' ORDER BY criado_em DESC LIMIT 1")]) == "t")
check("data", "padrão da coluna também é a data operacional",
      out([("root", "SELECT column_default FROM information_schema.columns WHERE table_name='movimentacoes_portaria' AND column_name='data_operacao'")]) == "data_operacional()")
check("data", "venda de balcão grava na data operacional",
      out([ABRE(), ("userA", "SELECT venda_portaria(NULL,'D1','P13',1,125,'money','recarga',true,NULL,'t','k-d1-aaaa')"),
           ("root", "SELECT data_operacao = data_operacional() FROM movimentacoes_portaria WHERE referencia_id=(SELECT id FROM orders WHERE client_name='D1')")]) == "t")
check("data", "lançamento retroativo explícito continua respeitado (data informada)",
      out([("userA", "SELECT registrar_movimentacao_portaria('ajuste','P13',1,0,0,NULL,NULL,NULL,'retro',data_operacional()-3)"),
           ("root", "SELECT data_operacao = data_operacional()-3 FROM movimentacoes_portaria WHERE observacoes='retro'")]) == "t")

# ── abertura obrigatória para transferir (sem criar abertura nem saldo)
e = err([SAIDA(1, "k-s0-aaaa")])
check("abertura", "sem abertura do dia a transferência é recusada com mensagem clara", "abertura da portaria" in e and "ainda não foi registrada" in e)
check("abertura", "recusa sem abertura não cria abertura, saldo, carga nem movimentos",
      out([("userA", tentar(SAIDA(1, "k-s0-aaaa")[1])),
           ("root", "SELECT (SELECT count(*) FROM movimentacoes_portaria WHERE data_operacao=data_operacional())||'/'||(SELECT count(*) FROM cargas)||'/'||(SELECT count(*) FROM carga_movimentos)")]) == "0/0/0")
check("abertura", "abertura de outro dia não vale para hoje",
      "ainda não foi registrada" in err([("userA", "SELECT registrar_movimentacao_portaria('abertura','P13',10,0,0,NULL,NULL,NULL,'ontem',data_operacional()-1)"),
                                          SAIDA(1, "k-s0b-aaa")]))
check("abertura", "saldo de outro dia não conta (abertura hoje com zero, ontem com 10)",
      "Saldo insuficiente" in err([("userA", "SELECT registrar_movimentacao_portaria('abertura','P13',10,0,0,NULL,NULL,NULL,'ontem',data_operacional()-1)"),
                                    ABRE(0), SAIDA(1, "k-s0c-aaa")]))
check("abertura", "atribuição com retirada da portaria também exige abertura (pedido continua na fila)",
      out([("root", f"INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity) VALUES ('{PED}','{U['userA']}','{ORG_A}','Ped 006','pending','recarga','P13',125,1)"),
           ("userA", tentar(f"SELECT atribuir_entrega('{PED}','{E}',true,'k-atr-0aaa')")),
           ("root", f"SELECT status FROM orders WHERE id='{PED}'")]) == "pending")

# ── saldo
check("saldo", "dentro do saldo: transfere e baixa a portaria uma vez",
      out([ABRE(10), SAIDA(4, "k-s1-aaaa"), ("root", f"SELECT ({SALDO[1]})||'/'||({CARGA[1]})")]) == "6/4")
e = err([ABRE(10), SAIDA(4, "k-s1-aaaa"), SAIDA(7, "k-s2-aaaa")])
check("saldo", "acima do disponível é recusada e informa disponível e solicitado", "Saldo insuficiente" in e and "disponível 6" in e and "solicitado 7" in e)
check("saldo", "recusa por saldo não deixa rastro (portaria e carga intactas)",
      out([ABRE(10), SAIDA(4, "k-s1-aaaa"), ("userA", tentar(SAIDA(7, "k-s2-aaaa")[1])), ("root", f"SELECT ({SALDO[1]})||'/'||({CARGA[1]})||'/'||({RASTRO[1]})")]) == "6/4/1/1")
check("saldo", "exatamente o disponível passa e zera o saldo",
      out([ABRE(10), SAIDA(10, "k-s3-aaaa"), SALDO]) == "0")
check("saldo", "vendas do dia reduzem o transferível",
      "disponível 7" in err([ABRE(10), ("userA", "SELECT venda_portaria(NULL,'S4','P13',3,375,'money','recarga',true,NULL,'t','k-s4v-aaa')"), SAIDA(8, "k-s4-aaaa")]))
check("saldo", "retorno de carga devolve à portaria e libera nova transferência",
      out([ABRE(5), SAIDA(5, "k-s5-aaaa"),
           ("userA", f"SELECT carga_devolver((SELECT id FROM cargas WHERE entregador_id='{E}' AND status='aberta'),'P13',2,0,'k-s5d-aaa')"),
           SAIDA(2, "k-s5b-aaa"), SALDO]) == "0")
check("saldo", "saldo é por produto (P20 não usa saldo de P13)",
      "Saldo insuficiente" in err([ABRE(10), SAIDA(1, "k-s6-aaaa", p="P20")]))
check("saldo", "atribuição com retirada respeita o saldo",
      "Saldo insuficiente" in err([ABRE(0),
           ("root", f"INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity) VALUES ('{PED}','{U['userA']}','{ORG_A}','Ped 006','pending','recarga','P13',125,1)"),
           ("userA", f"SELECT atribuir_entrega('{PED}','{E}',true,'k-atr-1aaa')")]))
check("saldo", "atribuição sem retirada não toca na portaria (atende por carga existente)",
      out([ABRE(0),
           ("root", f"INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity) VALUES ('{PED}','{U['userA']}','{ORG_A}','Ped 006','pending','recarga','P13',125,1)"),
           ("userA", f"SELECT atribuir_entrega('{PED}','{E}',false,NULL)"), ("root", f"SELECT status||'/'||({RASTRO[1]}) FROM orders WHERE id='{PED}'")]) == "assigned/0/0")

# ── validações
check("valida", "quantidade zero, negativa ou nula é recusada",
      all("Quantidade inválida" in err([ABRE(10), SAIDA(q, f"k-q{i}-aaaa")]) for i, q in enumerate(["0", "-1", "NULL"])))
check("valida", "produto sem controle é recusado", "sem controle" in err([ABRE(10), SAIDA(1, "k-v1-aaaa", p="Lenha")]))
check("valida", "destino que não é entregador é recusado", "Entregador inválido" in err([ABRE(10), SAIDA(1, "k-v2-aaaa", ent=U["userA"])]))
check("valida", "entregador de outra empresa é recusado", "outra empresa" in err([ABRE(10), SAIDA(1, "k-v3-aaaa", ent=U["entregadorB"])]))
check("valida", "entregador inativo é recusado",
      "inativo" in err([ABRE(10), ("root", f"SET LOCAL session_replication_role=replica; UPDATE profiles SET ativo=false WHERE id='{E}'; SET LOCAL session_replication_role=origin"), SAIDA(1, "k-v4-aaaa")]))
check("valida", "outra empresa não transfere para o entregador da empresa A",
      "outra empresa" in err([("adminB", f"SELECT registrar_movimentacao_portaria('abertura','P13',10,0,0)"), SAIDA(1, "k-v5-aaaa", who="adminB")]))
check("valida", "entregador não faz saída de carga para si", "Sem permissão" in err([ABRE(10), SAIDA(1, "k-v6-aaaa", who="entregadorA")]))
check("valida", "conta inativa não transfere", "inativa" in err([ABRE(10), SAIDA(1, "k-v7-aaaa", who="inativoA")]).lower() or "Sem permissão" in err([ABRE(10), SAIDA(1, "k-v7-aaaa", who="inativoA")]))
check("valida", "saída de carga direta pela função de movimento continua bloqueada",
      "Use a ação de carga" in err([ABRE(10), ("userA", "SELECT registrar_movimentacao_portaria('saida_carga','P13',-1,0,0)")]))
check("valida", "funções internas de trava/saldo/transferência não são chamáveis pelo cliente",
      all("permission denied" in err([("userA", s)]) for s in [
          f"SELECT _saldo_portaria_cheios('{ORG_A}','P13',current_date)",
          f"SELECT _travar_portaria('{ORG_A}','P13',current_date)",
          f"SELECT _transferir_para_carga('{ORG_A}','{E}','P13',1,NULL)"]))

# ── idempotência
check("reenvio", "mesma chave: uma transferência só",
      out([ABRE(10), SAIDA(3, "k-i1-aaaa"), SAIDA(3, "k-i1-aaaa"), ("root", f"SELECT ({SALDO[1]})||'/'||({RASTRO[1]})")]) == "7/1/1")
check("reenvio", "chave nova: nova transferência",
      out([ABRE(10), SAIDA(3, "k-i2-aaaa"), SAIDA(3, "k-i2-bbbb"), SALDO]) == "4")

# ── consulta para a tela
check("tela", "consulta de transferível mostra sem abertura",
      out([("userA", "SELECT abertura_registrada||'/'||cheios FROM saldo_transferivel_portaria('Botijão P13')")]) == "false/0")
check("tela", "consulta de transferível com abertura e saldo",
      out([ABRE(9), ("userA", "SELECT abertura_registrada||'/'||cheios||'/'||produto FROM saldo_transferivel_portaria('P13')")]) == "true/9/P13")
check("tela", "entregador não consulta o saldo da portaria", "Sem permissão" in err([("entregadorA", "SELECT * FROM saldo_transferivel_portaria('P13')")]))


# ── concorrência (confirma no banco descartável)
def par(a, b):
    res = [None, None]
    def run(i, s): res[i] = flow(s, commit=True)
    ts = [threading.Thread(target=run, args=(0, a)), threading.Thread(target=run, args=(1, b))]
    [t.start() for t in ts]; [t.join() for t in ts]
    return res


assert flow([ABRE(10)], commit=True)[0]
r = par([SAIDA(6, "k-c1-aaaa")], [SAIDA(6, "k-c1-bbbb")])
check("concorrência", "duas transferências de 6 com saldo 10 ao mesmo tempo: só uma passa",
      sum(1 for x in r if x[0]) == 1 and ("Saldo insuficiente" in (r[0][2] + r[1][2])))
check("concorrência", "saldo final 4 e carga 6: nunca negativo, nunca baixa dupla", out([("root", f"SELECT ({SALDO[1]})||'/'||({CARGA[1]})")]) == "4/6")
r = par([SAIDA(4, "k-c2-aaaa")], [SAIDA(4, "k-c2-aaaa")])
check("concorrência", "mesma chave enviada duas vezes ao mesmo tempo: uma transferência", out([SALDO]) == "0")
# Venda segura a trava (transação aberta por 1,5 s); a transferência chega depois e precisa ESPERAR e ver a venda.
# Sem a trava compartilhada, a transferência leria saldo 1 (venda ainda não confirmada) e deixaria a portaria em -1.
import time
assert flow([("userA", "SELECT registrar_movimentacao_portaria('ajuste','P13',1,0,0,NULL,NULL,NULL,'repõe 1')")], commit=True)[0]
res = [None, None]
def venda(): res[0] = flow([("userA", "SELECT venda_portaria(NULL,'C4','P13',1,125,'money','recarga',true,NULL,'t','k-c4v-aaa')"), ("root", "SELECT pg_sleep(1.5)")], commit=True)
def transf(): time.sleep(0.4); res[1] = flow([SAIDA(1, "k-c4-aaaa")], commit=True)
ts = [threading.Thread(target=venda), threading.Thread(target=transf)]
[t.start() for t in ts]; [t.join() for t in ts]
check("concorrência", "transferência que chega durante uma venda espera a trava e vê o saldo já consumido",
      res[0][0] and not res[1][0] and "Saldo insuficiente" in res[1][2] and out([SALDO]) == "0")

print(f"\n{LABEL}: {sum(1 for r in R if r[2])}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB", "/tmp/g1db") + f"/portaria006_{LABEL}.json", "w"), ensure_ascii=False)
