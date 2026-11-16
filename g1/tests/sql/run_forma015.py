"""Testes do 015 (correção administrativa da forma de pagamento). Banco DESCARTÁVEL em 127.0.0.1, só dados fictícios.
Rode depois de reset_com015.sh com_abertura. Uso: python3 run_forma015.py <URL> <rotulo>"""
import subprocess, sys, json, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "adminB": "b0000000-0000-4000-8000-00000000000a"}
ORG_A = "0a000000-0000-4000-8000-000000000000"


def psql(sql, commit=False):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:500]


def as_user(user):
    if user == "root":
        return "RESET ROLE;\n"
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
ORD = lambda cli: f"(SELECT id FROM orders WHERE client_name='{cli}' ORDER BY created_at DESC, id LIMIT 1)"


def LEGADA(cli, forma="convenio", titulo=True, valor_titulo=108, mesmo_instante=True, pago=None):
    """Venda concluída como gravada antes do 014: convênio com valor gerava promissória na mesma transação."""
    s = (f"SELECT set_config('g1.acao_controlada','on',true) \\g /dev/null\n"
         f"INSERT INTO orders(user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda,origem_venda,status,created_at) "
         f"VALUES ('{U['userA']}','{ORG_A}','{cli}','GLP P13',1,108,'{forma}','recarga','portaria','delivered','2026-11-16 11:43:12+00')")
    if titulo:
        criado = "'2026-11-16 11:43:12+00'" if mesmo_instante else "'2026-11-16 14:00:00+00'"
        s += (f";\nINSERT INTO promissory_notes(organization_id,client_name,value,due_date,status,created_by,order_id,notes,created_at,paid_amount,paid_at) "
              f"VALUES ('{ORG_A}','{cli}',{valor_titulo},'2026-12-16','{pago[0] if pago else 'pending'}','{U['userA']}',{ORD(cli)},'Venda a prazo',{criado},"
              f"{pago[1] if pago else 'NULL'},{(chr(39) + '2026-11-16 15:00:00+00' + chr(39)) if pago else 'NULL'})")
    s += ";\nSELECT set_config('g1.acao_controlada','off',true) \\g /dev/null"
    return Q(s)


COR = lambda cli, forma, k, user="adminA", motivo="Lançada errado: era Gás do Povo": (
    user, f"SELECT admin_corrigir_forma_pagamento({ORD(cli)},'{forma}','{motivo}','{k}')")
ESTADO = lambda cli: Q(
    f"SELECT o.payment_method||'|'||o.price||'|'||o.product||'|'||o.quantity||'|'||o.created_at||'|'||o.client_name||'|'||"
    f"coalesce((SELECT string_agg(status||':'||value, ',') FROM promissory_notes WHERE order_id=o.id),'-')||'|'||"
    f"(SELECT count(*) FROM recebimentos WHERE order_id=o.id)||'|'||(SELECT count(*) FROM reembolsos WHERE order_id=o.id)||'|'||"
    f"(SELECT count(*) FROM movimentacoes_portaria WHERE referencia_id=o.id)||'|'||(SELECT count(*) FROM carga_movimentos WHERE order_id=o.id)||'|'||"
    f"(SELECT count(*) FROM auditoria_correcoes WHERE registro_id=o.id OR registro_id IN (SELECT id FROM promissory_notes WHERE order_id=o.id)) "
    f"FROM orders o WHERE o.id={ORD(cli)}")
BASE = "|108.00|GLP P13|1|2026-11-16 11:43:12+00|"

# 1. correção autorizada + título indevido em aberto cancelado (preservado)
r = out([LEGADA("C1"), COR("C1", "gas-povo", "k-c1-015k"), ESTADO("C1")])
check("correção autorizada: Gás do Povo, R$108/produto/qtd/data/cliente preservados, título cancelado e mantido, sem recebimento/reembolso/estoque, 2 auditorias",
      r == "gas-povo" + BASE + "C1|cancelled:108.00|0|0|0|0|2", r)
r = out([LEGADA("C1b"), COR("C1b", "Gas do Povo", "k-c1b-015k"),
         Q(f"SELECT a.antes->>'payment_method'||'>'||(a.depois->>'payment_method')||'|'||a.motivo||'|'||a.feito_por||'|'||(a.feito_em IS NOT NULL) "
           f"FROM auditoria_correcoes a WHERE a.tabela='orders' AND a.registro_id={ORD('C1b')}")])
check("auditoria guarda forma anterior, nova, motivo, responsável e data", r == f"convenio>gas-povo|Lançada errado: era Gás do Povo|{U['adminA']}|true", r)
r = out([LEGADA("C1c"), COR("C1c", "gas-povo", "k-c1c-015k"),
         Q(f"SELECT count(*) FROM promissory_notes WHERE client_name='C1c' AND notes LIKE '%corrigida de convenio para gas-povo%'")])
check("histórico do título preservado com nota do ajuste", r == "1", r)
# outro título do mesmo cliente (sem vínculo) não muda
r = out([LEGADA("C1d"), Q(f"INSERT INTO promissory_notes(organization_id,client_name,value,due_date,status,created_by) VALUES ('{ORG_A}','C1d',108,'2026-12-16','pending','{U['userA']}')"),
         COR("C1d", "gas-povo", "k-c1d-015k"), Q("SELECT string_agg(status, ',' ORDER BY order_id NULLS LAST) FROM promissory_notes WHERE client_name='C1d'")])
check("outro título do cliente, mesmo nome e valor, continua em aberto", r == "cancelled,pending", r)

# 2. título com pagamento
e = err([LEGADA("C2", pago=("parcial", 50)), COR("C2", "gas-povo", "k-c2-015k")])
check("título com pagamento parcial bloqueia e pede conciliação", "pagamento ou baixa" in e, e)
e = err([LEGADA("C2b", pago=("paid", 108)), COR("C2b", "gas-povo", "k-c2b-015k")])
check("título quitado bloqueia", "pagamento ou baixa" in e, e)
r = out([LEGADA("C2c", pago=("parcial", 50)), Q("SELECT 1"), ESTADO("C2c")])
check("venda bloqueada continua como estava", r.startswith("convenio" + BASE), r)

# 3. vínculo ausente / insuficiente
e = err([LEGADA("C3", titulo=False), COR("C3", "gas-povo", "k-c3-015k")])
check("convênio antigo sem título vinculado bloqueia (não procura por nome/valor)", "conciliação" in e, e)
e = err([LEGADA("C3b", forma="promissoria", titulo=False), COR("C3b", "gas-povo", "k-c3b-015k")])
check("venda a prazo sem título vinculado bloqueia", "conciliação" in e, e)
e = err([LEGADA("C3c", mesmo_instante=False), COR("C3c", "gas-povo", "k-c3c-015k")])
check("título vinculado criado depois da venda (não comprovado) bloqueia", "não comprova" in e, e)
e = err([LEGADA("C3d", valor_titulo=50), COR("C3d", "gas-povo", "k-c3d-015k")])
check("título vinculado com outro valor bloqueia", "não comprova" in e, e)

# 4. toque duplo
r = out([LEGADA("C4"), COR("C4", "gas-povo", "k-c4-015k"), COR("C4", "gas-povo", "k-c4-015k"),
         Q(f"SELECT (SELECT count(*) FROM auditoria_correcoes WHERE registro_id={ORD('C4')})||'|'||(SELECT count(*) FROM promissory_notes WHERE order_id={ORD('C4')} AND status='cancelled')")])
check("toque duplo com a mesma chave: um ajuste só", r == "1|1", r)
e = err([LEGADA("C4b"), COR("C4b", "gas-povo", "k-c4b-015k"), COR("C4b", "gas-povo", "k-c4b2-015k")])
check("segunda correção com outra chave é recusada (já está com essa forma)", "já está registrada" in e, e)
e = err([LEGADA("C4c"), COR("C4c", "gas-povo", "k-c4c-015k"), COR("C4c", "vale-gas", "k-c4c-015k")])
check("mesma chave com outro conteúdo é recusada", "outro conteúdo" in e, e)

# toque duplo simultâneo (duas conexões ao mesmo tempo; este caso grava no banco descartável)
def paralelo(cli, k1, k2):
    assert run([LEGADA(cli)], commit=True)[0]
    sc = lambda k: f"SET TimeZone='UTC';\nBEGIN;\n{as_user('adminA')}{COR(cli, 'gas-povo', k)[1]};\nSELECT pg_sleep(0.5);\nCOMMIT;"
    ps = [subprocess.Popen(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for _ in (0, 1)]
    for p, k in zip(ps, (k1, k2)):
        p.stdin.write(sc(k)); p.stdin.close()
    res = [(p.wait(), p.stdout.read(), p.stderr.read()) for p in ps]
    est = out([Q(f"SELECT (SELECT count(*) FROM auditoria_correcoes WHERE registro_id={ORD(cli)})||'|'||(SELECT string_agg(status, ',') FROM promissory_notes WHERE order_id={ORD(cli)})")])
    return res, est
res, est = paralelo("C6", "k-c6-015k", "k-c6-015k")
check("toque duplo simultâneo, mesma chave: ambos respondem o mesmo ajuste, gravado uma vez", all(r[0] == 0 for r in res) and est == "1|cancelled", (res, est))
res, est = paralelo("C6b", "k-c6b1-015k", "k-c6b2-015k")
check("dois envios simultâneos com chaves diferentes: um aplica, o outro é recusado", sorted(r[0] for r in res) == [0, 3] and est == "1|cancelled" and any("já está registrada" in r[2] for r in res), (res, est))

# 5. acesso não autorizado
for who in ("userA", "entregadorA", "adminB"):
    e = err([LEGADA(f"C5{who}"), COR(f"C5{who}", "gas-povo", f"k-c5{who}-015k", user=who)])
    exp = "não encontrada" if who == "adminB" else "Sem permissão"
    check(f"{who}: recusado", exp in e, e)
e = err([LEGADA("C5m"), COR("C5m", "gas-povo", "k-c5m-015k", motivo="ok")])
check("motivo obrigatório", "Motivo obrigatório" in e, e)
e = err([LEGADA("C5x"), COR("C5x", "pix", "k-c5x-015k")])
check("trocar para PIX (exigiria recebimento) é recusado", "conciliação financeira" in e, e)
e = err([LEGADA("C5i"), COR("C5i", "cartao", "k-c5i-015k")])
check("forma inválida é recusada", "inválida" in e, e)
e = err([LEGADA("C5d"), ("userA", f"UPDATE orders SET payment_method='gas-povo' WHERE id={ORD('C5d')}")])
check("gravação direta continua bloqueada", "decisão B" in e or "ação autorizada" in e, e)

ok = sum(1 for r in R if r[1])
print(f"\n{LABEL}: {ok}/{len(R)}")
json.dump([{"nome": n, "ok": o} for n, o in R], open(os.path.join(os.path.dirname(__file__) or ".", f"result_forma015_{LABEL}.json"), "w"), ensure_ascii=False, indent=1)
sys.exit(0 if ok == len(R) else 1)
