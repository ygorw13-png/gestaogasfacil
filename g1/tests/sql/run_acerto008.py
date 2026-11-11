"""Testes do 008 (promissórias, destino do dinheiro e acerto dos entregadores) sobre 004..007.
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, dados fictícios. Rode depois de reset_com008.sh (com abertura fictícia).
Uso: python3 run_acerto008.py <URL> <rotulo>"""
import subprocess, sys, json, threading, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "adminB": "b0000000-0000-4000-8000-00000000000a"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
E = U["entregadorA"]
PED = "0a000000-0000-4000-8000-0000000008a1"


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


# IDs dos cobradores lidos como superusuário (o operador não lê colaboradores: só a lista limitada listar_cobradores).
_linhas = subprocess.run(["psql", URL, "-XAtq", "-c", "SELECT nome||'|'||id FROM colaboradores"], capture_output=True, text=True).stdout.splitlines()
_ids = dict(l.split("|", 1) for l in _linhas if "|" in l)
COB_A, COB_B = f"'{_ids['Cobrador A']}'", f"'{_ids['Cobrador B']}'"
R = []


def check(cat, name, cond):
    R.append((cat, name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}")


def tentar(sql):
    return f"DO $t$ BEGIN BEGIN PERFORM ({sql.replace('SELECT ', '', 1)}); EXCEPTION WHEN others THEN NULL; END; END $t$"


MAN = lambda k, v=100, cob="NULL", nome="Cliente Manual", cli="NULL", who="userA": (
    who, f"SELECT criar_promissoria_manual({cli},'{nome}',{v},data_operacional()+15,{cob},'divida antiga','{k}')")
NOTA = "(SELECT id FROM promissory_notes WHERE client_name='Cliente Manual' ORDER BY created_at DESC LIMIT 1)"
REC = lambda k, v, f="dinheiro", cob="NULL", nota=NOTA: ("userA", f"SELECT receber_promissoria({nota},{v},'{f}','{k}',{cob})")
NOTA_Q = lambda campos: ("root", f"SELECT {campos} FROM promissory_notes WHERE client_name='Cliente Manual' ORDER BY created_at DESC LIMIT 1")
SAIDA = lambda q, k: ("userA", f"SELECT carga_saida('{E}','P13',{q},'{k}')")
RUA = lambda k, forma="money", v=125: ("entregadorA", f"SELECT entregador_venda_rua(NULL,'Cliente Rua 008',NULL,'P13',1,{v},'{forma}','recarga',0,1,'t','{k}')")
PREVIA = ("userA", f"SELECT coalesce(string_agg(categoria||':'||forma||':'||qtd||':'||total::numeric(10,2), ',' ORDER BY categoria, forma),'-') FROM acerto_previa('{E}')")
ACERTO = lambda v, k, motivo="NULL", who="userA": (who, f"SELECT registrar_acerto('{E}',{v},{motivo},'{k}-acerto')")

# ── promissória manual
check("manual", "cria promissória pendente, com histórico, sem venda nem recebimento",
      out([MAN("k-m1-aaaa"), NOTA_Q("status||'/'||value||'/'||(SELECT count(*) FROM auditoria_correcoes WHERE motivo='Promissória manual')||'/'||(SELECT count(*) FROM recebimentos)||'/'||(SELECT count(*) FROM orders WHERE client_name='Cliente Manual')")]) == "pending/100.00/1/0/0")
check("manual", "com cobrador (por ID): fica atribuída com o nome e o ID do cobrador",
      out([MAN("k-m2-aaaa", cob=COB_A), NOTA_Q(f"status||'/'||assigned_to||'/'||(cobrador_id={COB_A})")]) == "assigned/Cobrador A/true")
check("manual", "cobrador de outra empresa é recusado", "Cobrador inválido" in err([MAN("k-m3-aaaa", cob=COB_B)]))
check("manual", "valor zero, sem cliente ou cliente de outra empresa são recusados",
      "maior que zero" in err([MAN("k-m4-aaaa", v=0)]) and "Identifique" in err([MAN("k-m5-aaaa", nome="")])
      and "outra empresa" in err([MAN("k-m6-aaaa", cli="(SELECT gen_random_uuid())")]))
check("manual", "reenvio com a mesma chave devolve a mesma promissória",
      out([MAN("k-m7-aaaa"), MAN("k-m7-aaaa"), ("root", "SELECT count(*) FROM promissory_notes WHERE client_name='Cliente Manual'")]) == "1")
check("manual", "mesma chave com outro valor é recusada", "outro conteúdo" in err([MAN("k-m8-aaaa"), MAN("k-m8-aaaa", v=99)]))
check("manual", "entregador não cria promissória manual", "Sem permissão" in err([MAN("k-m9-aaaa", who="entregadorA")]))

# ── cobrador
check("cobrador", "atribui cobrador por ID a promissória pendente",
      out([MAN("k-c1-aaaa"), ("userA", f"SELECT atribuir_cobrador({NOTA},{COB_A})"), NOTA_Q("status||'/'||assigned_to")]) == "assigned/Cobrador A")
check("cobrador", "retirar o cobrador volta a pendente",
      out([MAN("k-c2-aaaa", cob=COB_A), ("userA", f"SELECT atribuir_cobrador({NOTA},NULL)"), NOTA_Q("status||'/'||coalesce(assigned_to,'-')")]) == "pending/-")
check("cobrador", "promissória parcial continua 'parcial' ao receber cobrador (não perde o saldo)",
      out([MAN("k-c3-aaaa"), REC("k-c3-rec1", 30), ("userA", f"SELECT atribuir_cobrador({NOTA},{COB_A})"), NOTA_Q("status||'/'||paid_amount")]) == "parcial/30.00")
check("cobrador", "cobrador de outra empresa e promissória quitada são recusados",
      "Cobrador inválido" in err([MAN("k-c4-aaaa"), ("userA", f"SELECT atribuir_cobrador({NOTA},{COB_B})")])
      and "encerrada" in err([MAN("k-c5-aaaa"), REC("k-c5-rec1", 100), ("userA", f"SELECT atribuir_cobrador({NOTA},{COB_A})")]))
check("cobrador", "entregador não atribui cobrador", "Sem permissão" in err([MAN("k-c6-aaaa"), ("entregadorA", f"SELECT atribuir_cobrador((SELECT gen_random_uuid()),NULL)")]))

# ── recebimento
check("recebimento", "parcial: registra o recebimento, guarda o saldo e marca 'parcial'; destino caixa",
      out([MAN("k-r1-aaaa"), REC("k-r1-rec1", 40), ("root", f"SELECT (SELECT status||'/'||paid_amount FROM promissory_notes WHERE id={NOTA})||'/'||(SELECT destino||':'||valor FROM recebimentos WHERE promissory_id={NOTA})")]) == "parcial/40.00/caixa:40")
check("recebimento", "quitação depois do parcial: dois recebimentos preservados, status pago, saldo zero",
      out([MAN("k-r2-aaaa"), REC("k-r2-rec1", 40), REC("k-r2-rec2", 60), ("root", f"SELECT (SELECT status||'/'||paid_amount FROM promissory_notes WHERE id={NOTA})||'/'||(SELECT count(*)||':'||sum(valor) FROM recebimentos WHERE promissory_id={NOTA})")]) == "paid/100.00/2:100")
check("recebimento", "valor acima do saldo é recusado", "no máximo o saldo (60" in err([MAN("k-r3-aaaa"), REC("k-r3-rec1", 40), REC("k-r3-rec2", 61)]))
check("recebimento", "resposta perdida: reenvio com a mesma chave não recebe duas vezes",
      out([MAN("k-r4-aaaa"), REC("k-r4-rec1", 40), REC("k-r4-rec1", 40), ("root", f"SELECT count(*)||'/'||(SELECT paid_amount FROM promissory_notes WHERE id={NOTA}) FROM recebimentos WHERE promissory_id={NOTA}")]) == "1/40.00")
check("recebimento", "mesma chave com outro valor é recusada", "outro conteúdo" in err([MAN("k-r5-aaaa"), REC("k-r5-rec1", 40), REC("k-r5-rec1", 50)]))
check("recebimento", "recebido pelo cobrador na rua: dinheiro fica com o cobrador (não entra no caixa)",
      out([MAN("k-r6-aaaa", cob=COB_A), REC("k-r6-rec1", 50, cob=COB_A), ("root", f"SELECT destino||'/'||(responsavel_id={COB_A}) FROM recebimentos WHERE promissory_id={NOTA}")]) == "cobrador/true")
check("recebimento", "PIX: destino não informado (decisão 7 pendente)",
      out([MAN("k-r7-aaaa"), REC("k-r7-rec1", 50, f="pix"), ("root", f"SELECT destino FROM recebimentos WHERE promissory_id={NOTA}")]) == "nao_informado")
check("recebimento", "forma sem regra (transferência) é recusada", "sem regra" in err([MAN("k-r8-aaaa"), REC("k-r8-rec1", 50, f="transferencia")]))
check("recebimento", "chamada antiga com 4 argumentos continua válida",
      out([MAN("k-r9-aaaa"), ("userA", f"SELECT receber_promissoria({NOTA},10,'dinheiro','k-r9-rec1')"), NOTA_Q("paid_amount")]) == "10.00")

# ── venda a prazo, parcial e quitação sem duplicar faturamento (cenário 2)
VP = ("userA", "SELECT venda_portaria(NULL,'Cliente Prazo','P13',2,250,'promissoria','recarga',true,NULL,'t','k-vp-aaaa')")
NOTA_VP = "(SELECT id FROM promissory_notes WHERE client_name='Cliente Prazo')"
check("a prazo", "venda a prazo: conta 1 venda de 250 na data, gera promissória, nenhum dinheiro recebido",
      out([VP, ("root", "SELECT (SELECT count(*)||':'||sum(price) FROM orders WHERE client_name='Cliente Prazo')||'/'||(SELECT count(*) FROM recebimentos r JOIN orders o ON o.id=r.order_id WHERE o.client_name='Cliente Prazo')||'/'||(SELECT value FROM promissory_notes WHERE client_name='Cliente Prazo')")]) == "1:250.00/0/250.00")
check("a prazo", "recebe 100 e depois quita 150: faturamento continua 1 venda de 250; recebido 250 em 2 recebimentos",
      out([VP, REC("k-vp-rec1", 100, nota=NOTA_VP), REC("k-vp-rec2", 150, nota=NOTA_VP),
           ("root", f"SELECT (SELECT count(*)||':'||sum(price) FROM orders WHERE client_name='Cliente Prazo')||'/'||(SELECT count(*)||':'||sum(valor) FROM recebimentos WHERE promissory_id={NOTA_VP})||'/'||(SELECT status FROM promissory_notes WHERE id={NOTA_VP})")]) == "1:250.00/2:250/paid")

# ── destino do dinheiro nas vendas e entregas
check("destino", "venda de balcão em dinheiro entra no caixa",
      out([("userA", "SELECT venda_portaria(NULL,'Balcão 008','P13',1,125,'money','recarga',true,NULL,'t','k-d1-aaaa')"),
           ("root", "SELECT destino FROM recebimentos r JOIN orders o ON o.id=r.order_id WHERE o.client_name='Balcão 008'")]) == "caixa")
check("destino", "venda na rua em dinheiro fica com o entregador; em PIX, destino não informado",
      out([SAIDA(3, "k-d2-saida"), RUA("k-d2-rua1"), RUA("k-d2-rua2", forma="pix"),
           ("root", f"SELECT string_agg(destino||':'||coalesce((responsavel_id='{E}')::text,'-'), ',' ORDER BY destino) FROM recebimentos r JOIN orders o ON o.id=r.order_id WHERE o.client_name='Cliente Rua 008'")]) == "entregador:true,nao_informado:-")
ATR = [("root", f"INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity) VALUES ('{PED}','{U['userA']}','{ORG_A}','Entrega 008','pending','recarga','P13',125,1)"),
       ("userA", f"SELECT atribuir_entrega('{PED}','{E}',true,'k-d3-atr')")]
check("destino", "entrega concluída pela portaria: o dinheiro é do entregador até o acerto",
      out(ATR + [("userA", f"SELECT operador_concluir_entrega('{PED}','money',125,0,NULL,'k-d3-conc')"),
                 ("root", f"SELECT destino||'/'||(responsavel_id='{E}') FROM recebimentos WHERE order_id='{PED}'")]) == "entregador/true")

# ── acerto
CENA = [SAIDA(4, "k-a-saida"), RUA("k-a-rua1"), RUA("k-a-rua2", v=130), RUA("k-a-rua3", forma="pix", v=120)]
check("acerto", "prévia: dinheiro a entregar e PIX só informativo",
      out(CENA + [PREVIA]) == "entregar:dinheiro:2:255.00,informativo:pix:1:120.00")
check("acerto", "acerto exato: conferido, dinheiro vinculado, prévia zera o dinheiro; PIX não é vinculado",
      out(CENA + [ACERTO(255, "k-a-ac1"),
                  ("root", "SELECT status||'/'||dinheiro_esperado||'/'||dinheiro_entregue||'/'||diferenca||'/'||total_pix FROM acertos_entregador"),
                  ]) == "conferido/255/255.00/0.00/120"
      and out(CENA + [ACERTO(255, "k-a-ac1"), PREVIA]) == "informativo:pix:1:120.00"
      and out(CENA + [ACERTO(255, "k-a-ac1"), ("root", "SELECT count(*) FILTER (WHERE acerto_id IS NOT NULL)||'/'||count(*) FILTER (WHERE forma='pix' AND acerto_id IS NULL) FROM recebimentos")]) == "2/1")
check("acerto", "diferença sem motivo é recusada", "informe o motivo" in err(CENA + [ACERTO(250, "k-a-ac2")]))
check("acerto", "diferença com motivo: divergente, diferença registrada",
      out(CENA + [ACERTO(250, "k-a-ac3", motivo="'faltou troco de 5 reais'"), ("root", "SELECT status||'/'||diferenca||'/'||motivo_divergencia FROM acertos_entregador")]) == "divergente/-5.00/faltou troco de 5 reais")
check("acerto", "sem nada pendente e sem valor: recusado", "Nada a acertar" in err([ACERTO(0, "k-a-ac4")]))
check("acerto", "dinheiro já acertado não entra de novo (segundo acerto não acha pendência)",
      "Nada a acertar" in err(CENA + [ACERTO(255, "k-a-ac5"), ACERTO(0, "k-a-ac6")]))
check("acerto", "reenvio com a mesma chave: um acerto só",
      out(CENA + [ACERTO(255, "k-a-ac7"), ACERTO(255, "k-a-ac7"), ("root", "SELECT count(*) FROM acertos_entregador")]) == "1")
check("acerto", "mesma chave com outro valor é recusada", "outro conteúdo" in err(CENA + [ACERTO(255, "k-a-ac8"), ACERTO(250, "k-a-ac8", motivo="'outro'")]))
check("acerto", "dinheiro aguardando acerto: aparece com o nome do entregador e some depois do acerto",
      out(CENA + [("userA", "SELECT destino||':'||responsavel_nome||':'||total FROM dinheiro_aguardando_acerto()")]) == "entregador:Entregador A:255"
      and out(CENA + [ACERTO(255, "k-a-ac9"), ("userA", "SELECT count(*) FROM dinheiro_aguardando_acerto()")]) == "0")
check("acerto", "cobrador com dinheiro também aparece como aguardando prestação de contas",
      out([MAN("k-a-man1", cob=COB_A), REC("k-a-rec1", 50, cob=COB_A), ("userA", "SELECT destino||':'||responsavel_nome||':'||total FROM dinheiro_aguardando_acerto()")]) == "cobrador:Cobrador A:50")
check("acerto", "entregador não registra acerto nem vê prévia", "Sem permissão" in err(CENA + [ACERTO(255, "k-a-ac10", who="entregadorA")])
      and "Sem permissão" in err([("entregadorA", f"SELECT * FROM acerto_previa('{E}')")]))
check("acerto", "acerto não é gravado nem alterado direto na tabela",
      "row-level security" in err([("userA", f"INSERT INTO acertos_entregador(organization_id,entregador_id,status) VALUES ('{ORG_A}','{E}','conferido')")])
      and out(CENA + [ACERTO(255, "k-a-ac11"), ("userA", "UPDATE acertos_entregador SET dinheiro_entregue=0 RETURNING 1"), ("root", "SELECT dinheiro_entregue FROM acertos_entregador")]) == "255.00")
check("acerto", "outra empresa não vê nem acerta o entregador da empresa A",
      "outra empresa" in err([("adminB", f"SELECT * FROM acerto_previa('{E}')")]) and "outra empresa" in err([ACERTO(0, "k-a-ac12", who="adminB")]))
check("acerto", "entregador lê os próprios acertos",
      out(CENA + [ACERTO(255, "k-a-ac13"), ("entregadorA", "SELECT count(*) FROM acertos_entregador")]) == "1")

# ── cenário completo 1: abrir, transferir, vender, receber, devolver sobra, acertar
check("cenário", "abre 20, transfere 5, vende 2 na rua (dinheiro), devolve 3, acerta: portaria 18, carga 0, dinheiro acertado",
      out([SAIDA(5, "k-z-saida"), RUA("k-z-rua1"), RUA("k-z-rua2"),
           ("userA", f"SELECT carga_devolver((SELECT id FROM cargas WHERE entregador_id='{E}' AND status='aberta'),'P13',3,2,'k-z-devolucao')"),
           ACERTO(250, "k-z-ac"),
           ("root", f"SELECT _saldo_portaria_cheios('{ORG_A}','P13',data_operacional())||'/'||(SELECT sum(delta_cheios) FROM carga_movimentos)||'/'||(SELECT status||':'||dinheiro_entregue FROM acertos_entregador)||'/'||(SELECT count(*) FROM recebimentos WHERE acerto_id IS NULL AND forma='dinheiro')")])
      == "98/0/conferido:250.00/0")


# ── concorrência
def par(a, b):
    res = [None, None]
    def run(i, s): res[i] = flow(s, commit=True)
    ts = [threading.Thread(target=run, args=(0, a)), threading.Thread(target=run, args=(1, b))]
    [t.start() for t in ts]; [t.join() for t in ts]
    return res


assert flow(CENA, commit=True)[0]
r = par([ACERTO(255, "k-cc-ac1")], [ACERTO(255, "k-cc-ac2")])
check("concorrência", "dois acertos ao mesmo tempo: um passa; o dinheiro é vinculado a um acerto só",
      sum(1 for x in r if x[0]) == 1 and out([("root", "SELECT count(*)||'/'||count(DISTINCT acerto_id) FROM recebimentos WHERE forma='dinheiro'")]) == "2/1")
assert flow([MAN("k-cc-man", v=100)], commit=True)[0]
r = par([REC("k-cc-rec1", 70)], [REC("k-cc-rec2", 70)])
check("concorrência", "dois recebimentos de 70 numa promissória de 100: só um passa, saldo nunca negativo",
      sum(1 for x in r if x[0]) == 1 and out([NOTA_Q("paid_amount||'/'||status")]) == "70.00/parcial")

print(f"\n{LABEL}: {sum(1 for r in R if r[2])}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB", "/tmp/g1db") + f"/acerto008_{LABEL}.json", "w"), ensure_ascii=False)
