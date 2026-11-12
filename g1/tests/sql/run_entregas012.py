"""Testes do 012 (fluxo de entregas) sobre 001..011. Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, só dados fictícios.
Rode depois de reset_com012.sh com_abertura. Uso: python3 run_entregas012.py <URL> <rotulo>"""
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
ACE = lambda cli, who="entregadorA": (who, f"SELECT entregador_aceitar_entrega({ORD(cli)})")
REC = lambda cli, who="entregadorA": (who, f"SELECT entregador_recusar_entrega({ORD(cli)},'pneu furado')")
REA = lambda cli, novo, k, mot="'troca de rota hoje'", tr="false", who="userA": (who, f"SELECT reatribuir_entrega({ORD(cli)},{novo},{mot},{tr},'{k}')")
CON = lambda cli, k, forma="'money'", valor="125", vz="1", motivo="NULL", who="userA": (who, f"SELECT operador_concluir_entrega({ORD(cli)},{forma},{valor},{vz},{motivo},'{k}')")
BLOQ = lambda dia="data_operacional()", who="userA": (who, f"SELECT count(*) FROM entregas_bloqueando_fechamento({dia})")
BLOQ_IDS = lambda cli, dia="data_operacional()", who="userA": (who, f"SELECT count(*) FROM entregas_bloqueando_fechamento({dia}) b WHERE b.id={ORD(cli)}")
FECHA = lambda tipo="total", dia="data_operacional()", who="userA": (who, f"INSERT INTO fechamentos_caixa(data_fechamento,tipo,total_vendas,total_dinheiro,total_pix,total_cartao,total_outros,quantidades,estoque_final,divergencias,tem_divergencia,retroativo) VALUES ({dia},'{tipo}',0,0,0,0,0,'{{}}','[]','[]',false,false)")
MARCA = lambda who="userA": (who, "SELECT registrar_movimentacao_portaria('fechamento','P13',0,0,0,NULL,NULL,NULL,'Fechamento: teste',NULL)")
CARGA = lambda e: f"(SELECT coalesce(sum(m.delta_cheios),0) FROM carga_movimentos m JOIN cargas c ON c.id=m.carga_id WHERE c.entregador_id='{e}' AND c.status='aberta' AND m.produto='P13')"
PORT = f"(SELECT coalesce(sum(delta_cheios),0) FROM movimentacoes_portaria WHERE organization_id='{ORG_A}' AND produto='P13' AND data_operacao=data_operacional())"
EV = lambda cli, tipo: f"(SELECT count(*) FROM entrega_eventos WHERE order_id={ORD(cli)} AND tipo='{tipo}')"
ST = lambda cli: f"(SELECT status||'/'||coalesce(delivery_person_id::text,'-')||'/'||(accepted_at IS NOT NULL) FROM orders WHERE id={ORD(cli)})"
VB = lambda cli, k: ("userA", f"SELECT venda_portaria(NULL,'{cli}','P13',1,125,'money','recarga',NULL,NULL,'balcão teste 012','{k}',NULL,false)")
ANTIGO = lambda cli, status="delivering": Q(
    f"SET session_replication_role = replica; INSERT INTO orders(user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda,origem_venda,status,delivery_person,assigned_at,created_at) "
    f"VALUES ('{U['userA']}','{ORG_A}','{cli}','P13',1,120,'money','recarga','pedido','{status}','{COLAB_ANTIGO}',now()-interval '90 days',now()-interval '90 days'); SET session_replication_role = origin")

# ── 1. Pedidos como fonte única / modalidade / datas
check("fonte", "entrega de hoje aparece nas pendências do fechamento", out([PED("Hoje 1"), BLOQ_IDS("Hoje 1")]) == "1")
check("fonte", "balcão (venda da portaria) não aparece como entrega pendente",
      out([VB("Balcão 1", "balcao-012-1"), BLOQ()]) == "0")
check("fonte", "agendada para depois de amanhã fica fora das pendências de hoje",
      out([PED("Agendada 1", prevista="data_operacional()+2"), BLOQ()]) == "0")
check("fonte", "agendada aparece no dia previsto", out([PED("Agendada 1", prevista="data_operacional()+2"), BLOQ("data_operacional()+2")]) == "1")
check("fonte", "data prevista no passado é recusada",
      "passado" in err([PED("Passado 1", prevista="data_operacional()-1")]))
check("fonte", "entrega de ontem continua aberta hoje e bloqueia o fechamento de hoje",
      out([PED("Ontem 1", criado="now()-interval '1 day'"), BLOQ_IDS("Ontem 1")]) == "1")
check("fonte", "entrega de ontem continua com o mesmo status (sem baixa pela virada)",
      out([PED("Ontem 1", criado="now()-interval '1 day'"), Q(f"SELECT {ST('Ontem 1')}")]).startswith("pending/"))
check("fonte", "regra literal: entrega de 3 dias atrás não bloqueia o fechamento de hoje (só dia e dia anterior)",
      out([PED("Velha 1", criado="now()-interval '3 days'"), BLOQ()]) == "0")

# ── 2. Atribuir, aceitar, recusar, reatribuir
check("atribuir", "atribuição grava status 'aguardando aceite' por ID e evento",
      out([PED("At 1"), ATR("At 1"), Q(f"SELECT {ST('At 1')} || ':' || {EV('At 1','atribuicao')}")]) == f"assigned/{E1}/false:1")
check("aceite", "operador não aceita pelo entregador (gravação direta)",
      "Aceite só pelo próprio entregador" in err([PED("At 2"), ATR("At 2"), ("userA", f"UPDATE orders SET status='delivering' WHERE id={ORD('At 2')}")]))
check("aceite", "outro entregador não aceita atribuição alheia",
      "não atribuída a você" in err([PED("At 3"), ATR("At 3"), ACE("At 3", "entregador2A")]))
check("aceite", "entregador aceita a própria atribuição; aceitar não conclui nem movimenta dinheiro",
      out([PED("At 4"), ATR("At 4"), ACE("At 4"),
           Q(f"SELECT {ST('At 4')} || ':' || (SELECT count(*) FROM recebimentos WHERE order_id={ORD('At 4')}) || ':' || {EV('At 4','aceite')}")]) == f"delivering/{E1}/true:0:1")
check("reatribuir", "reatribuição sem motivo é recusada",
      "Motivo" in err([PED("Re 1"), ATR("Re 1"), REA("Re 1", f"'{E2}'", "reatr-012-1", mot="''")]))
check("reatribuir", "reatribuição invalida o aceite anterior e exige novo aceite",
      out([PED("Re 2"), ATR("Re 2"), ACE("Re 2"), REA("Re 2", f"'{E2}'", "reatr-012-2"),
           Q(f"SELECT {ST('Re 2')} || ':' || {EV('Re 2','reatribuicao')}")]) == f"assigned/{E2}/false:1")
check("reatribuir", "entregador anterior não aceita mais depois da reatribuição",
      "não atribuída a você" in err([PED("Re 3"), ATR("Re 3"), REA("Re 3", f"'{E2}'", "reatr-012-3"), ACE("Re 3")]))
check("reatribuir", "novo entregador aceita depois da reatribuição",
      out([PED("Re 4"), ATR("Re 4"), REA("Re 4", f"'{E2}'", "reatr-012-4"), ACE("Re 4", "entregador2A"), Q(f"SELECT {ST('Re 4')}")]) == f"delivering/{E2}/true")
check("reatribuir", "histórico preserva o motivo da reatribuição",
      out([PED("Re 5"), ATR("Re 5"), REA("Re 5", f"'{E2}'", "reatr-012-5"),
           Q(f"SELECT motivo FROM entrega_eventos WHERE order_id={ORD('Re 5')} AND tipo='reatribuicao'")]) == "Reatribuição: troca de rota hoje")
check("reatribuir", "duplo toque com a mesma chave grava uma reatribuição só",
      out([PED("Re 6"), ATR("Re 6"), REA("Re 6", f"'{E2}'", "reatr-012-6"), REA("Re 6", f"'{E2}'", "reatr-012-6"),
           Q(f"SELECT count(*) FROM auditoria_correcoes WHERE registro_id={ORD('Re 6')}")]) == "1")
check("recusa", "recusa registrada fica distinta de 'aguardando aceite'",
      out([PED("Rc 1"), ATR("Rc 1"), REC("Rc 1"),
           Q(f"SELECT status || '/' || coalesce(rejection_reason,'-') || ':' || {EV('Rc 1','recusa')} FROM orders WHERE id={ORD('Rc 1')}")]) == "pending/pneu furado:1")
check("recusa", "outro entregador não recusa atribuição alheia",
      "não atribuída a você" in err([PED("Rc 2"), ATR("Rc 2"), REC("Rc 2", "entregador2A")]))

# ── 3. Produto com o entregador anterior (sem teletransporte)
base = [PED("Cg 1"), ATR("Cg 1", retirar="true", k="atr-cg1-012")]
check("carga", "saída da portaria para a carga do entregador 1 (uma baixa só)",
      out(base + [Q(f"SELECT {CARGA(E1)} || ':' || {PORT}")]) == "1:99")
check("carga", "reatribuir sem transferência mantém o produto na carga do entregador 1",
      out(base + [REA("Cg 1", f"'{E2}'", "reatr-cg1"), Q(f"SELECT {CARGA(E1)} || ':' || {CARGA(E2)} || ':' || {PORT}")]) == "1:0:99")
check("carga", "conclusão pelo entregador 2 sem produto na carga dele é recusada",
      "carga" in err(base + [REA("Cg 1", f"'{E2}'", "reatr-cg1"), CON("Cg 1", "con-cg1-012")]).lower())
check("carga", "transferência física registrada move 1 cheio da carga 1 para a carga 2, portaria intacta",
      out(base + [REA("Cg 1", f"'{E2}'", "reatr-cg1", tr="true"), Q(f"SELECT {CARGA(E1)} || ':' || {CARGA(E2)} || ':' || {PORT} || ':' || {EV('Cg 1','transferencia_carga')}")]) == "0:1:99:1")
check("carga", "depois da transferência a conclusão consome a carga 2, sem baixa dupla",
      out(base + [REA("Cg 1", f"'{E2}'", "reatr-cg1", tr="true"), CON("Cg 1", "con-cg1-012"),
                  Q(f"SELECT {CARGA(E1)} || ':' || {CARGA(E2)} || ':' || {PORT} || ':' || {ST('Cg 1')}")]) == f"0:0:99:completed/{E2}/false")
check("carga", "transferência sem produto na carga anterior é recusada",
      "carga" in err([PED("Cg 2"), ATR("Cg 2"), REA("Cg 2", f"'{E2}'", "reatr-cg2", tr="true")]).lower())

# ── 4. Concluir entrega (portaria)
pronto = lambda cli, k: [PED(cli), ATR(cli, retirar="true", k=k)]
check("concluir", "sem forma de pagamento é recusado", "forma" in err(pronto("Co 1", "atr-co1-012") + [CON("Co 1", "con-co1", forma="NULL")]))
check("concluir", "sem quantidade de cascos é recusado (não presume zero)", "cascos" in err(pronto("Co 2", "atr-co2-012") + [CON("Co 2", "con-co2", vz="NULL")]))
check("concluir", "dinheiro sem valor recebido é recusado (não presume o preço)", "valor" in err(pronto("Co 3", "atr-co3-012") + [CON("Co 3", "con-co3", valor="NULL")]).lower())
check("concluir", "paga em dinheiro: 1 recebimento de 125 com o entregador, carga consumida",
      out(pronto("Co 4", "atr-co4-012") + [CON("Co 4", "con-co4"),
          Q(f"SELECT (SELECT string_agg(valor::text||'/'||destino,',') FROM recebimentos WHERE order_id={ORD('Co 4')}) || ':' || {CARGA(E1)} || ':' || (SELECT vasilhames_recebidos FROM orders WHERE id={ORD('Co 4')})")]) == "125.00/entregador:0:1")
check("concluir", "a prazo: promissória de 125 sem recebimento fictício",
      out(pronto("Co 5", "atr-co5-012") + [CON("Co 5", "con-co5", forma="'promissoria'", valor="NULL", vz="0"),
          Q(f"SELECT (SELECT count(*) FROM recebimentos WHERE order_id={ORD('Co 5')}) || ':' || (SELECT string_agg(value::text||'/'||status,',') FROM promissory_notes WHERE order_id={ORD('Co 5')})")]) == "0:125.00/pending")
check("concluir", "valor diferente sem motivo é recusado", "motivo" in err(pronto("Co 6", "atr-co6-012") + [CON("Co 6", "con-co6", valor="100")]))
check("concluir", "valor diferente com motivo: divergência registrada, preço original preservado",
      out(pronto("Co 7", "atr-co7-012") + [CON("Co 7", "con-co7", valor="100", motivo="'cliente pagou menos'"),
          Q(f"SELECT (SELECT price FROM orders WHERE id={ORD('Co 7')}) || ':' || (SELECT esperado||'/'||recebido FROM divergencias WHERE order_id={ORD('Co 7')}) || ':' || (SELECT sum(valor) FROM recebimentos WHERE order_id={ORD('Co 7')})")]) == "125.00:125.00/100.00:100.00")
check("concluir", "toque duplo / resposta perdida com a mesma chave: uma conclusão só",
      out(pronto("Co 8", "atr-co8-012") + [CON("Co 8", "con-co8"), CON("Co 8", "con-co8"),
          Q(f"SELECT (SELECT count(*) FROM recebimentos WHERE order_id={ORD('Co 8')}) || ':' || (SELECT count(*) FROM carga_movimentos WHERE order_id={ORD('Co 8')} AND tipo='consumo_entrega')")]) == "1:1")
check("concluir", "mesma chave com conteúdo diferente é recusada",
      "outro conteúdo" in err(pronto("Co 9", "atr-co9-012") + [CON("Co 9", "con-co9"), CON("Co 9", "con-co9", valor="120", motivo="'outro valor'")]))
check("concluir", "entregador atribuído inativo: conclusão recusada",
      "inativo" in err(pronto("Co 10", "atr-co10-012") + [Q(f"SET session_replication_role=replica; UPDATE profiles SET ativo=false WHERE id='{E1}'; SET session_replication_role=origin"), CON("Co 10", "con-co10")]))
check("concluir", "pedido pendente (sem atribuição) não conclui", "atribuídas" in err([PED("Co 11"), CON("Co 11", "con-co11")]))

# ── 5. Fechamento total bloqueado no banco
check("fechamento", "fechamento total com entrega aberta de hoje é recusado (chamada direta)",
      "Fechamento total bloqueado" in err([PED("Fe 1"), FECHA()]))
check("fechamento", "marca de fechamento da portaria também é recusada",
      "Fechamento total bloqueado" in err([PED("Fe 2"), MARCA()]))
check("fechamento", "fechamento parcial continua permitido (conferência)",
      out([PED("Fe 3"), FECHA("partial"), Q("SELECT count(*) FROM fechamentos_caixa WHERE tipo='partial'")]) == "1")
check("fechamento", "entrega aguardando aceite bloqueia", "bloqueado" in err([PED("Fe 4"), ATR("Fe 4"), FECHA()]))
check("fechamento", "entrega em rota bloqueia", "bloqueado" in err([PED("Fe 5"), ATR("Fe 5"), ACE("Fe 5"), FECHA()]))
check("fechamento", "entrega concluída não bloqueia",
      out(pronto("Fe 6", "atr-fe6-012") + [CON("Fe 6", "con-fe6"), FECHA(), Q("SELECT count(*) FROM fechamentos_caixa WHERE tipo='total'")]) == "1")
check("fechamento", "entrega cancelada (reversão autorizada) não bloqueia",
      out([PED("Fe 7"), ("adminA", f"SELECT reversao_solicitar({ORD('Fe 7')},'cancelamento','cliente desistiu',NULL,NULL,true,'canc-fe7-012')"),
           FECHA(), Q(f"SELECT (SELECT status FROM orders WHERE id={ORD('Fe 7')}) || ':' || (SELECT count(*) FROM fechamentos_caixa WHERE tipo='total')")]) == "cancelled:1")
check("fechamento", "agendamento futuro não bloqueia", out([PED("Fe 8", prevista="data_operacional()+3"), FECHA(), Q("SELECT count(*) FROM fechamentos_caixa WHERE tipo='total'")]) == "1")
check("fechamento", "balcão não bloqueia", out([VB("Fe 9", "balcao-fe9-012"), FECHA(), Q("SELECT count(*) FROM fechamentos_caixa WHERE tipo='total'")]) == "1")
check("fechamento", "entrega de ontem em aberto bloqueia o fechamento de hoje",
      "bloqueado" in err([PED("Fe 10", criado="now()-interval '1 day'"), FECHA()]))
check("fechamento", "depois do fechamento total, entrega nova para o mesmo dia é recusada",
      "já teve fechamento total" in err([FECHA(), PED("Fe 11")]))
check("fechamento", "depois do fechamento total, entrega agendada para amanhã é aceita",
      out([FECHA(), PED("Fe 12", prevista="data_operacional()+1"), Q("SELECT count(*) FROM orders WHERE client_name='Fe 12'")]) == "1")
check("fechamento", "reagendar uma entrega para o dia já fechado é recusado",
      "já teve fechamento total" in err([PED("Fe 13", prevista="data_operacional()+2"), FECHA(),
                                          ("userA", f"UPDATE orders SET entrega_prevista=data_operacional() WHERE id={ORD('Fe 13')}")]))

# ── 6. Registros antigos
check("antigos", "registro antigo (entregador por cadastro, sem conta) pede revisão",
      out([ANTIGO("Antigo 1"), Q(f"SELECT entrega_motivo_revisao(status,delivery_person_id,delivery_person,accepted_at) FROM orders WHERE id={ORD('Antigo 1')}")]) == "Entregador registrado sem conta identificada no aplicativo")
check("antigos", "registro antigo não pode ser reatribuído por operador (exige regularização)",
      "regularização" in err([ANTIGO("Antigo 2"), REA("Antigo 2", f"'{E1}'", "reatr-ant2")]))
check("antigos", "registro antigo não pode ser concluído sem regularização",
      "identificado" in err([ANTIGO("Antigo 3"), CON("Antigo 3", "con-ant3")]))
check("antigos", "operador não regulariza", "administrador" in err([ANTIGO("Antigo 4"), ("userA", f"SELECT entrega_regularizar({ORD('Antigo 4')},NULL,'conferido com o dono','reg-ant4-012')")]))
check("antigos", "administrador devolve à fila com motivo; histórico guarda o entregador antigo; nada de estoque ou dinheiro",
      out([ANTIGO("Antigo 5"), ("adminA", f"SELECT entrega_regularizar({ORD('Antigo 5')},NULL,'sem comprovação da entrega','reg-ant5-012')"),
           Q(f"SELECT {ST('Antigo 5')} || ':' || (SELECT entregador_anterior_texto FROM entrega_eventos WHERE order_id={ORD('Antigo 5')} AND tipo='regularizacao') || ':' || "
             f"(SELECT antes->>'delivery_person' FROM auditoria_correcoes WHERE registro_id={ORD('Antigo 5')}) || ':' || "
             f"(SELECT count(*) FROM carga_movimentos WHERE order_id={ORD('Antigo 5')}) || ':' || (SELECT count(*) FROM recebimentos WHERE order_id={ORD('Antigo 5')})")]) == f"pending/-/false:{COLAB_ANTIGO}:{COLAB_ANTIGO}:0:0")
check("antigos", "administrador atribui por ID com motivo: exige novo aceite",
      out([ANTIGO("Antigo 6"), ("adminA", f"SELECT entrega_regularizar({ORD('Antigo 6')},'{E1}','entregador confirmou que está com ele','reg-ant6-012')"),
           Q(f"SELECT {ST('Antigo 6')}")]) == f"assigned/{E1}/false")
check("antigos", "regularização sem motivo é recusada", "Motivo" in err([ANTIGO("Antigo 7"), ("adminA", f"SELECT entrega_regularizar({ORD('Antigo 7')},NULL,'','reg-ant7-012')")]))
check("antigos", "pedido normal não usa regularização", "não precisa" in err([PED("Antigo 8"), ATR("Antigo 8"), ("adminA", f"SELECT entrega_regularizar({ORD('Antigo 8')},NULL,'teste indevido','reg-ant8-012')")]))
check("antigos", "registro antigo cancelado pela reversão: sem estoque nem dinheiro",
      out([ANTIGO("Antigo 9"), ("adminA", f"SELECT reversao_solicitar({ORD('Antigo 9')},'cancelamento','registro antigo sem entrega',NULL,NULL,true,'canc-ant9-012')"),
           Q(f"SELECT (SELECT status FROM orders WHERE id={ORD('Antigo 9')}) || ':' || {PORT} || ':' || (SELECT count(*) FROM carga_movimentos WHERE order_id={ORD('Antigo 9')})")]) == "cancelled:100:0")
check("antigos", "registro de 90 dias atrás não bloqueia o fechamento de hoje (regra do dia e dia anterior)",
      out([ANTIGO("Antigo 10"), BLOQ()]) == "0")

# ── 7. Papéis e outra empresa
check("papeis", "lista de entregadores usa os papéis (2 da empresa A, ativos)",
      out([("userA", "SELECT string_agg(nome, ',' ORDER BY nome) FROM listar_entregadores()")]) == "Entregador A,Entregador Dois A")
check("papeis", "entregador inativo sai da lista",
      out([Q(f"SET session_replication_role=replica; UPDATE profiles SET ativo=false WHERE id='{E2}'; SET session_replication_role=origin"),
           ("userA", "SELECT count(*) FROM listar_entregadores()")]) == "1")
check("papeis", "entregador não lista entregadores nem pendências", all("permiss" in err([(w, s)]).lower() for w, s in [
      ("entregadorA", "SELECT * FROM listar_entregadores()"), ("entregadorA", "SELECT * FROM entregas_bloqueando_fechamento(data_operacional())")]))
check("papeis", "entregador não regulariza nem reatribui", all("permiss" in err([ANTIGO("Antigo 11"), (w, s)]).lower() or "administrador" in err([ANTIGO("Antigo 11"), (w, s)]) for w, s in [
      ("entregadorA", f"SELECT entrega_regularizar({ORD('Antigo 11')},NULL,'tentativa indevida','reg-ent-012')"),
      ("entregadorA", f"SELECT reatribuir_entrega({ORD('Antigo 11')},NULL,'tentativa indevida',false,'reatr-ent-012')")]))
check("empresa", "entrega aberta da empresa B não bloqueia o fechamento da empresa A",
      out([PED("B 1", who="adminB", org=ORG_B), FECHA(), Q(f"SELECT count(*) FROM fechamentos_caixa WHERE organization_id='{ORG_A}' AND tipo='total'")]) == "1")
check("empresa", "pendências da empresa A não mostram pedidos da empresa B", out([PED("B 2", who="adminB", org=ORG_B), BLOQ()]) == "0")
check("empresa", "operador da empresa A não reatribui pedido da empresa B",
      "não encontrado" in err([PED("B 3", who="adminB", org=ORG_B), REA("B 3", f"'{E1}'", "reatr-b3-012")]))
check("empresa", "entregador da empresa A não pode ser atribuído na empresa B",
      "outra empresa" in err([PED("B 4", who="adminB", org=ORG_B), ATR("B 4", who="adminB")]))
check("empresa", "fechamento da empresa B não bloqueia entrega nova da empresa A",
      out([FECHA(who="adminB"), PED("B 5"), Q("SELECT count(*) FROM orders WHERE client_name='B 5'")]) == "1")

# ── 8. Corrida entre fechamento e alteração de entrega (duas sessões reais, com COMMIT)
def sessao(steps, res, idx, espera):
    script = "".join(as_user(u) + s + ";\n" for u, s in steps)
    time.sleep(espera)
    res[idx] = psql(script, commit=True)

res = [None, None]
t1 = threading.Thread(target=sessao, args=([PED("Corrida 1"), Q("SELECT pg_sleep(2)")], res, 0, 0))
t2 = threading.Thread(target=sessao, args=([FECHA()], res, 1, 0.7))
t1.start(); t2.start(); t1.join(); t2.join()
check("corrida", "entrega criada durante o fechamento: o fechamento espera e é recusado", res[0][0] and not res[1][0] and "bloqueado" in res[1][2], res)
psql("RESET ROLE; SET session_replication_role=replica; DELETE FROM orders WHERE client_name='Corrida 1'; SET session_replication_role=origin;", commit=True)

res = [None, None]
t1 = threading.Thread(target=sessao, args=([FECHA(), Q("SELECT pg_sleep(2)")], res, 0, 0))
t2 = threading.Thread(target=sessao, args=([PED("Corrida 2")], res, 1, 0.7))
t1.start(); t2.start(); t1.join(); t2.join()
check("corrida", "fechamento em andamento: entrega nova para o mesmo dia espera e é recusada", res[0][0] and not res[1][0] and "já teve fechamento total" in res[1][2], res)
psql(f"RESET ROLE; DELETE FROM fechamentos_caixa WHERE organization_id='{ORG_A}'; SET session_replication_role=replica; DELETE FROM orders WHERE client_name='Corrida 2'; SET session_replication_role=origin;", commit=True)

res = [None, None]
k = "con-corrida-012"
prep = pronto("Corrida 3", "atr-corrida3-012")
ok = flow(prep, commit=True)[0]
t1 = threading.Thread(target=sessao, args=([CON("Corrida 3", k)], res, 0, 0))
t2 = threading.Thread(target=sessao, args=([CON("Corrida 3", k)], res, 1, 0))
t1.start(); t2.start(); t1.join(); t2.join()
dup = out([Q(f"SELECT (SELECT count(*) FROM recebimentos WHERE order_id={ORD('Corrida 3')}) || ':' || (SELECT count(*) FROM carga_movimentos WHERE order_id={ORD('Corrida 3')} AND tipo='consumo_entrega')")])
check("corrida", "duas conclusões simultâneas com a mesma chave: um recebimento e uma baixa", ok and dup == "1:1", (res, dup))

ok_n = sum(1 for r in R if r[2])
print(f"\n{LABEL}: {ok_n}/{len(R)}")
json.dump({"rotulo": LABEL, "total": len(R), "ok": ok_n, "itens": [{"cat": c, "nome": n, "ok": o} for c, n, o in R]},
          open(f"{__file__.rsplit('/',1)[0]}/result_entregas012_{LABEL}.json", "w"), ensure_ascii=False, indent=1)
