"""Testes do 013 (bloqueio do fechamento total sem limite de antiguidade) sobre 001..012.
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, só dados fictícios. Rode depois de reset_com013.sh com_abertura.
Uso: python3 run_bloqueio013.py <URL> <rotulo>"""
import subprocess, sys, json, threading, time
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "entregador2A": "a0000000-0000-4000-8000-0000000000f2",
     "adminB": "b0000000-0000-4000-8000-00000000000a"}
ORG_A, ORG_B = "0a000000-0000-4000-8000-000000000000", "0b000000-0000-4000-8000-000000000000"
E1, E2 = U["entregadorA"], U["entregador2A"]
COLAB_ANTIGO = "c01ab000-0000-4000-8000-000000000001"   # id de cadastro de colaborador (sem conta no app)


def psql(sql, commit=False):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:500]


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


def check(cat, name, cond, info=None):
    R.append((cat, name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}" + ("" if cond or info is None else f"  -> {info}"))


Q = lambda sql: ("root", sql)
ORD = lambda cli: f"(SELECT id FROM orders WHERE client_name='{cli}' ORDER BY created_at DESC, id LIMIT 1)"


def PED(cli, who="userA", org=ORG_A, prevista="NULL", criado="now()", preco=125, forma="money"):
    uid = U[who]
    return (who, f"INSERT INTO orders(user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda,origem_venda,entrega_prevista,created_at) "
                 f"VALUES ('{uid}','{org}','{cli}','P13',1,{preco},'{forma}','recarga','pedido',{prevista},{criado})")


ATR = lambda cli, e=E1, retirar="false", k=None, who="userA": (who, f"SELECT atribuir_entrega({ORD(cli)},'{e}',{retirar},{('%s' % repr(k)) if k else 'NULL'})")
BLOQ = lambda dia="data_operacional()", who="userA": (who, f"SELECT count(*) FROM entregas_bloqueando_fechamento({dia})")
BLOQ_DIA = lambda cli, dia="data_operacional()": ("userA", f"SELECT coalesce((SELECT (b.data_prevista - data_operacional())::text FROM entregas_bloqueando_fechamento({dia}) b WHERE b.id={ORD(cli)}),'fora')")
FECHA = lambda dia="data_operacional()", tipo="total", who="userA": (who, f"INSERT INTO fechamentos_caixa(data_fechamento,tipo,total_vendas,total_dinheiro,total_pix,total_cartao,total_outros,quantidades,estoque_final,divergencias,tem_divergencia,retroativo) VALUES ({dia},'{tipo}',0,0,0,0,0,'{{}}','[]','[]',false,false)")
MARCA = lambda who="userA": (who, "SELECT registrar_movimentacao_portaria('fechamento','P13',0,0,0,NULL,NULL,NULL,'Fechamento: teste',NULL)")
VB = lambda cli, k: ("userA", f"SELECT venda_portaria(NULL,'{cli}','P13',1,125,'money','recarga',NULL,NULL,'balcão teste 013','{k}',NULL,false)")
TOTAIS = Q("SELECT count(*) FROM fechamentos_caixa WHERE tipo='total'")

check("bloqueia", "entrega aberta de hoje bloqueia o fechamento total", "Fechamento total bloqueado" in err([PED("B Hoje"), FECHA()]))
check("bloqueia", "entrega aberta de ontem bloqueia", "Fechamento total bloqueado" in err([PED("B Ontem", criado="now()-interval '1 day'"), FECHA()]))
check("bloqueia", "entrega aberta de três dias atrás bloqueia", "Fechamento total bloqueado" in err([PED("B Tres", criado="now()-interval '3 days'"), FECHA()]))
check("bloqueia", "entrega aberta do mês anterior bloqueia", "Fechamento total bloqueado" in err([PED("B Mes", criado="now()-interval '1 month'"), FECHA()]))
check("bloqueia", "entrega aberta de 90 dias atrás, atribuída, bloqueia",
      "Fechamento total bloqueado" in err([PED("B Velha", criado="now()-interval '90 days'"), ATR("B Velha"), FECHA()]))
check("bloqueia", "marca de fechamento da portaria também é recusada por entrega antiga",
      "Fechamento total bloqueado" in err([PED("B Marca", criado="now()-interval '10 days'"), MARCA()]))
check("bloqueia", "mensagem informa a quantidade e 'previsão até' a data do fechamento",
      "2 entrega(s) em aberto com previsão até" in err([PED("B M1", criado="now()-interval '5 days'"), PED("B M2"), FECHA()]))
check("nao_bloqueia", "agendamento futuro não bloqueia o fechamento de hoje",
      out([PED("N Futuro", prevista="data_operacional()+1"), FECHA(), TOTAIS]) == "1")
check("nao_bloqueia", "balcão não bloqueia", out([VB("N Balcao", "balcao-013"), FECHA(), TOTAIS]) == "1")
check("nao_bloqueia", "fechamento parcial continua permitido com entrega antiga aberta",
      out([PED("N Parcial", criado="now()-interval '20 days'"), FECHA(tipo="partial"), Q("SELECT count(*) FROM fechamentos_caixa WHERE tipo='partial'")]) == "1")
check("nao_bloqueia", "fechamento retroativo de anteontem não é bloqueado por entrega de ontem",
      out([PED("N Depois", criado="now()-interval '1 day'"), FECHA("data_operacional()-2"), TOTAIS]) == "1")
check("lista", "lista de pendências usa a mesma regra: hoje, ontem, 3 dias e mês anterior entram; futuro e balcão não",
      out([PED("L Hoje"), PED("L Ontem", criado="now()-interval '1 day'"), PED("L Tres", criado="now()-interval '3 days'"),
           PED("L Mes", criado="now()-interval '1 month'"), PED("L Fut", prevista="data_operacional()+2"), VB("L Balcao", "balcao-l-013"), BLOQ()]) == "4")
check("lista", "agendamento futuro entra na lista do próprio dia previsto",
      out([PED("L Fut2", prevista="data_operacional()+2"), BLOQ_DIA("L Fut2", "data_operacional()+2")]) == "2")
check("data", "sem data prevista, vale o dia operacional da criação (23h Bahia = dia anterior)",
      out([PED("D Noite", criado="(data_operacional()::timestamp + interval '2 hours') AT TIME ZONE 'UTC'"), BLOQ_DIA("D Noite")]) == "-1")
check("data", "nenhuma data ou status é alterado pela consulta ou pela recusa",
      out([PED("D Fixa", criado="now()-interval '3 days'"), BLOQ(), Q(f"SELECT status || ':' || (entrega_prevista IS NULL) FROM orders WHERE id={ORD('D Fixa')}")]) == "pending:true")
check("trava", "depois do fechamento total de hoje, entrega nova para hoje é recusada",
      "já teve fechamento total" in err([FECHA(), PED("T Nova")]))
check("trava", "depois do fechamento total, entrega agendada para amanhã é aceita",
      out([FECHA(), PED("T Amanha", prevista="data_operacional()+1"), Q("SELECT count(*) FROM orders WHERE client_name='T Amanha'")]) == "1")

ok_n = sum(1 for r in R if r[2])
print(f"\n{LABEL}: {ok_n}/{len(R)}")
