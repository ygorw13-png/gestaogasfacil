"""Testes do 017 (agregados: retirada sem preço, sigilo, por conta, acerto, devolução). Banco DESCARTÁVEL em 127.0.0.1,
só dados fictícios. Rode depois de reset_com017.sh com_abertura. Uso: python3 run_agregado017.py <URL>"""
import subprocess, sys, json
URL = sys.argv[1]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "adminB": "b0000000-0000-4000-8000-00000000000a"}
ORG_A, ORG_B = "0a000000-0000-4000-8000-000000000000", "0b000000-0000-4000-8000-000000000000"
RA, RB, RC = "c0000000-0000-4000-8000-0000000000a1", "c0000000-0000-4000-8000-0000000000b1", "c0000000-0000-4000-8000-0000000000a2"


def psql(sql, commit=False):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:500]


def as_user(user):
    if user == "root":
        return "RESET ROLE;\n"
    if user == "anon":
        return "RESET ROLE; SET LOCAL ROLE anon;\n"
    claims = json.dumps({"sub": U[user], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"


def run(steps, commit=False):
    return psql("".join(as_user(u) + s + ";\n" for u, s in steps), commit)


out = lambda steps: (lambda r: r[1] if r[0] else "ERRO:" + r[2])(run(steps))
err = lambda steps: (lambda r: "" if r[0] else r[2])(run(steps))
R = []


def check(name, cond, info=None):
    R.append((name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} {name}" + ("" if cond or info is None else f"  -> {info}"))


Q = lambda sql: ("root", sql)
G = lambda k: "t." + k.replace("-", "_")
V = lambda k: f"current_setting('{G(k)}')::uuid"
CAP = lambda k, expr: f"SELECT set_config('{G(k)}', ({expr})::text, false) \\g /dev/null"
LOAD = lambda *ks: Q(";\n".join(f"SELECT set_config('{G(k)}', (SELECT resultado::text FROM acoes_idempotentes WHERE chave='{k}'), false) \\g /dev/null" for k in ks))
RET = lambda k, q=2, r=RA, who="userA", tipo="recarga", com="false": (who, CAP(k, f"retirada_agregado('{r}','GLP P13',{q},'{tipo}',NULL,{com},NULL,'{k}')"))
ORD = V
PC = lambda k, v, forma="money", r=RA, who="adminA": (who, CAP(k, f"agregado_por_conta_registrar('{r}',{v},'{forma}',NULL,'teste','{k}')"))
PCID = V
ITENS = lambda *pares: "'" + json.dumps([{"order_id": "__" + k + "__", "quantidade": q} for k, q in pares]) + "'::jsonb"


def itens(*pares):
    arr = ",".join(f"jsonb_build_object('order_id',{ORD(k)},'quantidade',{q})" for k, q in pares)
    return f"jsonb_build_array({arr})"


def creditos(*pares):
    arr = ",".join(f"jsonb_build_object('id',{PCID(k)},'valor',{v})" for k, v in pares)
    return f"jsonb_build_array({arr})" if pares else "'[]'::jsonb"


ACERTO = lambda k, its, valor, cred="'[]'::jsonb", pag="NULL", forma="NULL", r=RA, who="adminA": (
    who, CAP(k, f"agregado_acerto_registrar('{r}',{its},{valor},{cred},{pag},{forma},NULL,'{k}')"))
AID = V
SALDO = lambda k: Q(f"SELECT _agregado_acerto_saldo({AID(k)})")
CRED = lambda k: f"_agregado_credito_saldo({PCID(k)})"

# fixtures fictícias (gravadas no banco descartável)
ok = run([Q(f"INSERT INTO resellers(id,organization_id,name,price_p13) VALUES ('{RA}','{ORG_A}','Agregado Fictício A',97),"
            f"('{RC}','{ORG_A}','Agregado Fictício C',90),('{RB}','{ORG_B}','Agregado Fictício B',99) ON CONFLICT DO NOTHING"),
          Q(f"INSERT INTO agregado_precos(reseller_id,produto,organization_id,preco) VALUES ('{RA}','P13','{ORG_A}',97),('{RB}','P13','{ORG_B}',99) ON CONFLICT DO NOTHING")], commit=True)
assert ok[0], ok

# 1. retirada pela portaria sem preço
r = out([RET("k-r1-0170"), Q(f"SELECT o.payment_method||'|'||coalesce(o.price::text,'null')||'|'||o.reseller_id||'|'||o.client_name||'|'||o.status||'|'||o.origem_venda||'|'||"
        f"(SELECT delta_cheios||'/'||delta_vazios FROM movimentacoes_portaria WHERE referencia_id=o.id)||'|'||"
        f"(SELECT count(*) FROM recebimentos WHERE order_id=o.id)||'|'||(SELECT count(*) FROM promissory_notes WHERE order_id=o.id) FROM orders o WHERE o.id={ORD('k-r1-0170')}")])
check("retirada: pedido sem preço, forma própria 'agregado', estoque -2 cheios/+2 vazios, sem recebimento nem promissória",
      r == f"agregado|null|{RA}|Agregado Fictício A|delivered|portaria|-2/2|0|0", r)
r = out([RET("k-r1b-0170"), ("userA", f"SELECT count(*) FROM orders WHERE id={ORD('k-r1b-0170')}"),
         ("userA", f"SELECT string_agg(quantidade||':'||acertada||':'||pendente, ',') FROM agregado_conta('{RA}') WHERE order_id={ORD('k-r1b-0170')}")])
check("retirada visível ao operador (listas) e na conta quantitativa: 2 retirados, 0 acertados, 2 pendentes", r == "2:0:2", r)
r = out([RET("k-r1c-0170", tipo="completa", com="true"), Q(f"SELECT tipo||'|'||delta_cheios||'/'||delta_vazios||'/'||delta_emprestados FROM movimentacoes_portaria WHERE referencia_id={ORD('k-r1c-0170')}")])
check("retirada em comodato preserva a distinção física (venda_comodato, emprestados)", r == "venda_comodato|-2/0/2", r)
r = out([RET("k-r1d-0170"), RET("k-r1d-0170"), Q("SELECT count(*) FROM orders WHERE payment_method='agregado' AND reseller_id='" + RA + "'")])
check("toque duplo com a mesma chave: uma retirada só", r == "1", r)

# 2. falta de abertura / saldo: recusada sem gravação parcial
e = err([RET("k-r2-0170", q=1000)], )
check("saldo insuficiente recusado", "Saldo insuficiente" in e, e)
e = err([Q("DELETE FROM movimentacoes_portaria WHERE tipo='abertura'"), RET("k-r2b-0170")])
check("sem abertura do dia recusado", "abertura" in e, e)
run([RET("k-r2c-0170", q=1000)], commit=True)
r = out([Q("SELECT (SELECT count(*) FROM orders WHERE quantity=1000)||'|'||(SELECT count(*) FROM movimentacoes_portaria WHERE delta_cheios=-1000)||'|'||(SELECT count(*) FROM acoes_idempotentes WHERE chave='k-r2c-0170')")])
check("recusa não deixa pedido, movimento nem chave gravados", r == "0|0|0", r)

# 3. sigilo do preço
e = err([("userA", "SELECT price_p13 FROM resellers")])
check("operador: coluna antiga de preço negada", "permission denied" in e, e)
e = err([("anon", "SELECT name FROM resellers")])
check("sem login: agregados negados", "permission denied" in e, e)
r = out([("userA", "SELECT count(*) FROM agregado_precos")])
check("operador não lê preços", r == "0", r)
r = out([("adminA", "SELECT string_agg(preco::text, ',') FROM agregado_precos")])
check("administrador lê o preço da própria empresa", r == "97.00", r)
e = err([("userA", f"SELECT agregado_financeiro('{RA}')")])
check("operador: resumo financeiro negado por chamada direta", "Sem permissão" in e, e)
e = err([("userA", f"SELECT agregado_preco_definir('{RA}','P13',100)")])
check("operador não define preço", "administrador" in e, e)
r = out([PC("k-s1-0170", 300), ("userA", "SELECT (SELECT count(*) FROM agregado_lancamentos)||'|'||(SELECT count(*) FROM agregado_acertos)")])
check("operador não lê por contas nem acertos", r == "0|0", r)
e = err([PC("k-s2-0170", 300, who="userA")])
check("operador não registra por conta", "administrador" in e, e)
e = err([("entregadorA", f"SELECT * FROM agregado_conta('{RA}')")])
check("entregador não consulta a conta do agregado", "Sem permissão" in e, e)
r = out([("userA", "SELECT name FROM resellers WHERE id='" + RA + "'")])
check("operador ainda lê o cadastro sem preço", r == "Agregado Fictício A", r)

# 4. por conta 1000, acerto 900 -> crédito restante 100
r = out([RET("k-a1r-0170", q=9), PC("k-a1p-0170", 1000), ACERTO("k-a1-0170", itens(("k-a1r-0170", 9)), 900, creditos(("k-a1p-0170", 900))),
         Q(f"SELECT _agregado_acerto_saldo({AID('k-a1-0170')})||'|'||{CRED('k-a1p-0170')}||'|'||(SELECT count(*) FROM agregado_lancamentos WHERE tipo='pagamento')")])
check("por conta R$1.000 + acerto R$900: acerto quitado, crédito restante R$100, sem dinheiro novo", r == "0.00|100.00|0", r)

# 5. por conta 1000, acerto 1200 com complemento 200
r = out([RET("k-a2r-0170", q=12), PC("k-a2p-0170", 1000), ACERTO("k-a2-0170", itens(("k-a2r-0170", 12)), 1200, creditos(("k-a2p-0170", 1000)), 200, "'money'"),
         Q(f"SELECT _agregado_acerto_saldo({AID('k-a2-0170')})||'|'||{CRED('k-a2p-0170')}||'|'||"
           f"(SELECT sum(valor) FROM agregado_lancamentos WHERE tipo IN ('por_conta','pagamento') AND reseller_id='{RA}')||'|'||"
           f"(SELECT string_agg(tipo||':'||valor||':'||coalesce(destino,'-'), ',' ORDER BY criado_em, tipo) FROM agregado_lancamentos WHERE reseller_id='{RA}')")])
check("por conta R$1.000 + acerto R$1.200 + complemento R$200: quitado, crédito zerado, dinheiro recebido total R$1.200 (sem duplicar)",
      r.startswith("0.00|0.00|1200.00|") and r.count("pagamento:200.00:caixa") == 1 and r.count("por_conta:1000.00:caixa") == 1, r)

# 6. acerto parcialmente pago
r = out([RET("k-a3r-0170", q=5), ACERTO("k-a3-0170", itens(("k-a3r-0170", 5)), 500, pag=200, forma="'pix'"), SALDO("k-a3-0170")])
check("acerto R$500 com R$200 em PIX: saldo devedor R$300", r == "300.00", r)
r = out([RET("k-a3r-0170", q=5), ACERTO("k-a3-0170", itens(("k-a3r-0170", 5)), 500, pag=200, forma="'pix'"),
         ("adminA", f"SELECT agregado_acerto_pagar({AID('k-a3-0170')},'[]'::jsonb,300,'money',NULL,'k-a3b-0170') \\g /dev/null"), SALDO("k-a3-0170")])
check("complemento posterior de R$300 quita o acerto", r == "0.00", r)
e = err([RET("k-a3r-0170", q=5), ACERTO("k-a3-0170", itens(("k-a3r-0170", 5)), 500, pag=200, forma="'pix'"),
         ("adminA", f"SELECT agregado_acerto_pagar({AID('k-a3-0170')},'[]'::jsonb,400,'money',NULL,'k-a3c-0170')")])
check("pagamento acima do devido recusado (sobra vira por conta, não some)", "passam do valor devido" in e, e)
e = err([RET("k-a3r-0170", q=5), ACERTO("k-a3-0170", itens(("k-a3r-0170", 3)), 300, pag=100, forma="'pix'"),
         ACERTO("k-a3d-0170", itens(("k-a3r-0170", 3)), 300)])
check("quantidade já vinculada a acerto parcialmente pago não é acertada de novo", "ainda não acertadas 2" in e, e)
r = out([RET("k-a3r-0170", q=5), ACERTO("k-a3-0170", itens(("k-a3r-0170", 3)), 300),
         ("userA", f"SELECT string_agg(acertada||':'||pendente, ',') FROM agregado_conta('{RA}') WHERE order_id={ORD('k-a3r-0170')}")])
check("acerto parcial de quantidades: 3 acertados, 2 pendentes (visível ao operador sem valor)", r == "3:2", r)
e = err([RET("k-a3r-0170", q=2), ACERTO("k-a3-0170", itens(("k-a3r-0170", 2)), 200, pag=0, forma="NULL", cred=creditos()),
         ("adminA", f"SELECT agregado_acerto_pagar({AID('k-a3-0170')},'[]'::jsonb,50,NULL,NULL,'k-a3e-0170')")])
check("recebimento sem forma real recusado", "forma real" in e, e)
e = err([PC("k-a3f-0170", 100, forma="vale-gas")])
check("por conta só com forma real de dinheiro (vale-gás recusado)", "forma real" in e, e)
e = err([PC("k-a3g-0170", 0)])
check("por conta com valor zero recusado", "maior que zero" in e, e)

# 7. devoluções
r = out([RET("k-d1r-0170"), ("adminA", CAP('k-d1v-0170', f"reversao_solicitar({ORD('k-d1r-0170')},'devolucao','Agregado devolveu',NULL,NULL,true,'k-d1v-0170')")),
         ("userA", f"SELECT reversao_confirmar_fisico({ORD('k-d1v-0170')},'portaria',NULL,2,0,2,0,'intacto','ok','k-d1c-0170') \\g /dev/null"),
         ("userA", f"SELECT string_agg(devolvida||':'||em_devolucao||':'||pendente, ',') FROM agregado_conta('{RA}') WHERE order_id={ORD('k-d1r-0170')}"),])
check("devolução antes do acerto: retorno físico confirmado, pendente zerado", r == "2:true:0", r)
e = err([RET("k-d1r-0170"), ("adminA", CAP('k-d1v-0170', f"reversao_solicitar({ORD('k-d1r-0170')},'devolucao','Agregado devolveu',NULL,NULL,true,'k-d1v-0170')")),
         ACERTO("k-d1a-0170", itens(("k-d1r-0170", 1)), 100)])
check("retirada em devolução não entra em acerto", "devolução registrada" in e, e)
r = out([RET("k-d1r-0170"), ("adminA", CAP('k-d1v-0170', f"reversao_solicitar({ORD('k-d1r-0170')},'devolucao','Agregado devolveu',NULL,NULL,true,'k-d1v-0170')")),
         Q(f"SELECT (SELECT coalesce(sum(delta_cheios),0) FROM movimentacoes_portaria WHERE tipo='reversao' AND referencia_id={ORD('k-d1v-0170')})")])
check("estoque só volta com devolução física confirmada (autorizada, ainda sem retorno: nada)", r == "0", r)

e = err([RET("k-d2r-0170"), ACERTO("k-d2-0170", itens(("k-d2r-0170", 2)), 200, pag=200, forma="'money'"),
         ("adminA", f"SELECT reversao_solicitar({ORD('k-d2r-0170')},'devolucao','Agregado devolveu',NULL,NULL,true,'k-d2v-0170')")])
check("devolução depois do acerto sem ajuste é recusada", "ajuste administrativo" in e, e)
r = out([RET("k-d2r-0170"), ACERTO("k-d2-0170", itens(("k-d2r-0170", 2)), 200, pag=200, forma="'money'"),
         ("adminA", CAP('k-d2x-0170', f"agregado_devolucao_acertada({ORD('k-d2r-0170')},{AID('k-d2-0170')},200,'Agregado devolveu','k-d2x-0170')")),
         Q(f"SELECT (SELECT count(*) FROM agregado_acertos WHERE id={AID('k-d2-0170')})||'|'||_agregado_acerto_saldo({AID('k-d2-0170')})||'|'||"
           f"(SELECT sum(valor) FROM agregado_lancamentos WHERE tipo='credito_ajuste')||'|'||(SELECT count(*) FROM agregado_lancamentos WHERE tipo='ajuste' AND reversao_id IS NOT NULL)||'|'||"
           f"(SELECT status FROM reversoes WHERE id={ORD('k-d2x-0170')})||'|'||(SELECT count(*) FROM agregado_lancamentos WHERE tipo='pagamento')")])
check("devolução depois do acerto: ajuste vinculado, acerto preservado, pago vira crédito de R$200, reversão aguardando retorno, pagamento intacto",
      r == "1|0.00|200.00|1|aguardando_retorno|1", r)
r = out([RET("k-d3r-0170", q=4), ACERTO("k-d3-0170", itens(("k-d3r-0170", 4)), 400),
         ("adminA", f"SELECT agregado_acerto_ajustar({AID('k-d3-0170')},-50,'Desconto combinado','k-d3a-0170') \\g /dev/null"),
         Q(f"SELECT _agregado_acerto_saldo({AID('k-d3-0170')})||'|'||(SELECT count(*) FROM movimentacoes_portaria WHERE referencia_id={ORD('k-d3r-0170')})")])
check("corrigir acerto não movimenta estoque de novo", r == "350.00|1", r)

# 8. por conta usado não é anulado; devolução de crédito registrada
e = err([RET("k-p1r-0170"), PC("k-p1-0170", 300), ACERTO("k-p1a-0170", itens(("k-p1r-0170", 2)), 200, creditos(("k-p1-0170", 200))),
         ("adminA", f"SELECT agregado_por_conta_anular({PCID('k-p1-0170')},'Lançado errado','k-p1x-0170')")])
check("por conta já utilizado não pode ser anulado", "não pode ser anulado" in e, e)
r = out([PC("k-p2-0170", 300), ("adminA", f"SELECT agregado_credito_devolver({PCID('k-p2-0170')},120,'money','Agregado pediu de volta','k-p2d-0170') \\g /dev/null"),
         Q(f"SELECT {CRED('k-p2-0170')}")])
check("devolução de crédito: R$120 devolvidos registrados, R$180 continuam disponíveis", r == "180.00", r)
e = err([PC("k-p3-0170", 100), ("adminA", f"SELECT agregado_credito_devolver({PCID('k-p3-0170')},150,'money','Agregado pediu de volta','k-p3d-0170')")])
check("devolver mais do que o crédito disponível é recusado", "Crédito insuficiente" in e, e)
e = err([PC("k-p4-0170", 100, r=RC), RET("k-p4r-0170"), ACERTO("k-p4a-0170", itens(("k-p4r-0170", 2)), 200, creditos(("k-p4-0170", 100)))])
check("crédito de outro agregado não é usado", "não encontrado para este agregado" in e, e)

# 9. isolamento entre empresas
e = err([RET("k-i1-0170", who="adminB")])
check("empresa B não registra retirada no agregado da empresa A", "não encontrado" in e, e)
e = err([PC("k-i2-0170", 100, who="adminB")])
check("empresa B não registra por conta no agregado da empresa A", "não encontrado" in e, e)
e = err([RET("k-i3r-0170"), ("adminB", f"SELECT agregado_acerto_registrar('{RA}',{itens(('k-i3r-0170', 1))},100,'[]'::jsonb,NULL,NULL,NULL,'k-i3-0170')")])
check("empresa B não acerta retiradas da empresa A", "não encontrado" in e, e)
r = out([RET("k-i4r-0170"), ACERTO("k-i4-0170", itens(("k-i4r-0170", 2)), 200), PC("k-i4p-0170", 50),
         ("adminB", "SELECT (SELECT count(*) FROM agregado_acertos)||'|'||(SELECT count(*) FROM agregado_lancamentos)||'|'||(SELECT count(*) FROM agregado_acerto_itens)||'|'||(SELECT string_agg(preco::text, ',') FROM agregado_precos)")])
check("empresa B não vê acertos, lançamentos e itens da A; só o próprio preço", r == "0|0|0|99.00", r)
e = err([RET("k-i5r-0170"), ACERTO("k-i5-0170", itens(("k-i5r-0170", 2)), 200),
         ("adminB", f"SELECT agregado_acerto_pagar({AID('k-i5-0170')},'[]'::jsonb,100,'money',NULL,'k-i5p-0170')")])
check("empresa B não recebe acerto da A", "não encontrado" in e, e)

# 10. bloqueios e regras preservadas
e = err([("userA", f"INSERT INTO orders(client_name,product,quantity,payment_method,tipo_venda,status) VALUES ('X','GLP P13',1,'agregado','recarga','pending')")])
check("pedido de agregado por gravação direta é recusado", "ação de retirada" in e, e)
e = err([RET("k-b1-0170"), Q(f"SELECT set_config('g1.acao_controlada','on',true) \\g /dev/null"), Q(f"UPDATE orders SET price=10 WHERE id={ORD('k-b1-0170')}")])
check("preço nunca é gravado na retirada, nem por ação controlada", "não muda forma, preço" in e, e)
e = err([("adminA", f"INSERT INTO conta_botijoes(parceiro_tipo,parceiro_id,parceiro_nome,tipo,quantidade,preco_unitario) VALUES ('agregado','{RA}','A','pagamento',1,97)")])
check("conta antiga não recebe novo lançamento de agregado (nem com preço)", "retirada da portaria" in e, e)
r = out([("userA", f"INSERT INTO conta_botijoes(parceiro_tipo,parceiro_id,parceiro_nome,tipo,quantidade) VALUES ('ponto',gen_random_uuid(),'Ponto X','entrega',1)"), Q("SELECT 'ok'")])
check("pontos de revenda continuam como estavam", r == "ok", r)
e = err([("userA", "SELECT venda_portaria(NULL,'Avulso','GLP P13',1,NULL,'money','recarga',true,NULL,NULL,'k-v1-0170')")])
check("venda regular em Dinheiro continua exigindo valor", "Informe um valor maior que zero" in e, e)
r = out([("userA", "SELECT venda_portaria(NULL,'Avulso','GLP P13',1,NULL,'vale-gas','recarga',true,NULL,NULL,'k-v2-0170') \\g /dev/null"), Q("SELECT 'ok'")])
check("Vale-gás continua com valor opcional", r == "ok", r)

# 11. tentativas simultâneas (gravadas no banco descartável)
PRE = ""
def paralelo(sqls):
    sc = lambda s: f"SET TimeZone='UTC';\n{PRE}\nBEGIN;\n{as_user('adminA')}{s};\nSELECT pg_sleep(0.4);\nCOMMIT;"
    ps = [subprocess.Popen(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for _ in sqls]
    for p, s in zip(ps, sqls):
        p.stdin.write(sc(s)); p.stdin.close()
    return [(p.wait(), p.stderr.read()) for p in ps]

assert run([RET("k-c1r-0170", r=RC, q=3), RET("k-c2r-0170", r=RC, q=3), PC("k-c1p-0170", 1000, r=RC)], commit=True)[0]
PRE = LOAD("k-c1r-0170", "k-c2r-0170", "k-c1p-0170")[1] + ";"
res = paralelo([ACERTO("k-c1-0170", itens(("k-c1r-0170", 3)), 800, creditos(("k-c1p-0170", 800)), r=RC)[1],
                ACERTO("k-c2-0170", itens(("k-c2r-0170", 3)), 800, creditos(("k-c1p-0170", 800)), r=RC)[1]])
r = out([LOAD("k-c1p-0170"), Q(f"SELECT {CRED('k-c1p-0170')}||'|'||(SELECT count(*) FROM agregado_acertos WHERE reseller_id='{RC}')")])
check("dois acertos simultâneos não consomem o mesmo crédito duas vezes", sorted(x[0] for x in res) == [0, 3] and r == "200.00|1"
      and any("Crédito insuficiente" in x[1] for x in res), (res, r))
assert run([RET("k-c3r-0170", r=RC, q=3)], commit=True)[0]
PRE = LOAD("k-c3r-0170")[1] + ";"
res = paralelo([ACERTO("k-c3-0170", itens(("k-c3r-0170", 3)), 300, r=RC)[1], ACERTO("k-c4-0170", itens(("k-c3r-0170", 2)), 200, r=RC)[1]])
r = out([LOAD("k-c3r-0170"), Q(f"SELECT sum(quantidade) FROM agregado_acerto_itens WHERE order_id={ORD('k-c3r-0170')}")])
check("dois acertos simultâneos não acertam a mesma quantidade duas vezes", sorted(x[0] for x in res) == [0, 3] and r in ("3", "2"), (res, r))
res = paralelo([PC("k-c5-0170", 100, r=RC)[1], PC("k-c5-0170", 100, r=RC)[1]])
r = out([Q(f"SELECT count(*) FROM agregado_lancamentos WHERE reseller_id='{RC}' AND tipo='por_conta' AND valor=100")])
check("toque duplo simultâneo no por conta: gravado uma vez", all(x[0] == 0 for x in res) and r == "1", (res, r))

ok = sum(1 for _, c in R if c)
print(f"\n{ok}/{len(R)} PASS")
sys.exit(0 if ok == len(R) else 1)
