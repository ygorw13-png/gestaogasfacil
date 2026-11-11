"""Testes do 005 (tipo de venda canônico + reenvio preso ao conteúdo) sobre o 004.
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, dados fictícios. Rode depois de reset_com005.sh.
Uso: python3 run_vendas005.py <URL> <rotulo>
Cada verificação roda em transação própria que é desfeita, exceto o bloco de concorrência (que confirma)."""
import subprocess, sys, json, threading, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"userA": "a0000000-0000-4000-8000-00000000000b", "entregadorA": "a0000000-0000-4000-8000-00000000000d",
     "entregadorB": "b0000000-0000-4000-8000-00000000000d"}


def psql(sql, commit=False):
    script = f"BEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
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


def VP(nome, tipo, chave, qty=1, valor=125, forma="money", dev="true", vaz="NULL", com="false", obs="teste", produto="P13", legado=False):
    base = f"'{nome}','{produto}',{qty},{valor},'{forma}','{tipo}',{dev},NULL,'{obs}','{chave}'"
    extra = "" if legado else f",{vaz},{com}"
    return f"SELECT venda_portaria(NULL,{base}{extra})"


def tentar(sql):
    """Executa e engole o erro dentro de um subbloco (desfaz só a tentativa), para contar o que sobrou."""
    return f"DO $t$ BEGIN BEGIN PERFORM ({sql.replace('SELECT ', '', 1)}); EXCEPTION WHEN others THEN NULL; END; END $t$"


def pedido(nome):
    return (f"SELECT tipo_venda||'/'||vasilhames_entregues||'/'||vasilhames_recebidos||'/'||has_empty_cylinder FROM orders "
            f"WHERE client_name='{nome}' ORDER BY created_at DESC LIMIT 1")


def mov(nome):
    return (f"SELECT tipo||'/'||delta_cheios||'/'||delta_vazios||'/'||delta_emprestados FROM movimentacoes_portaria "
            f"WHERE referencia_id=(SELECT id FROM orders WHERE client_name='{nome}' ORDER BY created_at DESC LIMIT 1)")


def contagens(nome):
    return (f"SELECT (SELECT count(*) FROM orders WHERE client_name='{nome}')||'/'||"
            f"(SELECT count(*) FROM movimentacoes_portaria WHERE referencia_id IN (SELECT id FROM orders WHERE client_name='{nome}'))||'/'||"
            f"(SELECT count(*) FROM recebimentos WHERE order_id IN (SELECT id FROM orders WHERE client_name='{nome}'))")


# ── Tipo canônico na venda de portaria
check("tipo", "'completa' é aceito e gravado como 'completa'; casco sai, cheio baixa",
      out([("userA", VP("T1", "completa", "k-t1-aaaa")), ("root", pedido("T1")), ("root", mov("T1"))]) == "venda/-1/0/0")
check("tipo", "pedido 'completa': tipo, cascos entregues/recebidos e devolução",
      out([("userA", VP("T1", "completa", "k-t1-aaaa", dev="false")), ("root", pedido("T1"))]) == "completa/1/0/false")
check("tipo", "'completo' (entrada alternativa) é aceito e gravado como 'completa'",
      out([("userA", VP("T2", "completo", "k-t2-aaaa")), ("root", pedido("T2"))]).startswith("completa/"))
check("tipo", "'COMPLETA ' (caixa/espaço) também normaliza",
      out([("userA", VP("T2b", "COMPLETA ", "k-t2b-aaaa")), ("root", pedido("T2b"))]).startswith("completa/"))
check("tipo", "tipo desconhecido é recusado", "Tipo de venda inválido" in err([("userA", VP("T3", "xyz", "k-t3-aaaa"))]))
check("tipo", "tipo desconhecido não deixa pedido, movimentação nem recebimento",
      out([("userA", tentar(VP("T3", "xyz", "k-t3-aaaa"))), ("root", contagens("T3"))]) == "0/0/0")
check("tipo", "recarga: recebe vazio por unidade; cheio baixa; vazio entra",
      out([("userA", VP("T4", "recarga", "k-t4-aaaa", qty=2, valor=250)), ("root", pedido("T4")), ("root", mov("T4"))]) == "venda/-2/2/0")
check("tipo", "recarga: pedido com entregues 0 e recebidos = quantidade",
      out([("userA", VP("T4", "recarga", "k-t4-aaaa", qty=2, valor=250)), ("root", pedido("T4"))]) == "recarga/0/2/true")
check("tipo", "vasilhame: sai só o casco (cheio 0, vazio -qtd), cascos entregues = qtd",
      out([("userA", VP("T5", "vasilhame", "k-t5-aaaa", qty=3, valor=300, dev="false", produto="Vasilhame P13")),
           ("root", pedido("T5")), ("root", mov("T5"))]) == "venda/0/-3/0")
check("tipo", "omitir o tipo equivale a 'recarga' (comportamento anterior preservado)",
      out([("userA", "SELECT venda_portaria(NULL,'T5b','P13',1,125,'money',NULL,NULL,NULL,'t','k-t5b-aaaa')"), ("root", pedido("T5b"))]).startswith("recarga/"))

# ── Cascos informados pela tela (antes ignorados pela ação)
check("cascos", "completa com 2 vazios devolvidos: pedido=completa/1/2 e movimentação=venda/-1/2/0",
      out([("userA", VP("T6", "completa", "k-t6-aaaa", vaz=2, dev="true")), ("root", pedido("T6"))]) == "completa/1/2/true"
      and out([("userA", VP("T6", "completa", "k-t6-aaaa", vaz=2, dev="true")), ("root", mov("T6"))]) == "venda/-1/2/0")
check("cascos", "comodato: casco emprestado = quantidade, nenhum vazio entra, tipo de movimentação 'venda_comodato'",
      out([("userA", VP("T7", "completa", "k-t7-aaaa", qty=2, valor=250, dev="false", com="true")), ("root", mov("T7"))]) == "venda_comodato/-2/0/2")
check("cascos", "vazios recebidos negativos são recusados",
      "inválidos" in err([("userA", VP("T8", "recarga", "k-t8-aaaa", vaz=-1))]))
check("cascos", "chamada com 11 argumentos (formato antigo) continua válida",
      out([("userA", VP("T9", "recarga", "k-t9-aaaa", legado=True)), ("root", pedido("T9"))]).startswith("recarga/"))

# ── Reenvio preso ao conteúdo
check("reenvio", "mesma chave e mesmo conteúdo devolve o mesmo pedido, sem duplicar nada",
      out([("userA", VP("T10", "recarga", "k-t10-aaa")), ("userA", VP("T10", "recarga", "k-t10-aaa")),
           ("root", contagens("T10"))]) == "1/1/1")
check("reenvio", "mesma chave: devolve o mesmo identificador",
      out([("userA", "CREATE TEMP TABLE _r(id uuid)"), ("userA", "INSERT INTO _r " + VP("T10", "recarga", "k-t10-aaa")),
           ("userA", "INSERT INTO _r " + VP("T10", "recarga", "k-t10-aaa")), ("userA", "SELECT count(DISTINCT id) FROM _r")]) == "1")
check("reenvio", "mesma chave com valor diferente é recusada (não vira outra venda em silêncio)",
      "outro conteúdo" in err([("userA", VP("T11", "recarga", "k-t11-aaa", valor=125)), ("userA", VP("T11", "recarga", "k-t11-aaa", valor=130))]))
check("reenvio", "mesma chave com produto/quantidade/forma/tipo diferentes também é recusada",
      all("outro conteúdo" in err([("userA", VP("T12", "recarga", "k-t12-aaa")), ("userA", v)]) for v in [
          VP("T12", "recarga", "k-t12-aaa", qty=2), VP("T12", "recarga", "k-t12-aaa", forma="pix"),
          VP("T12", "completa", "k-t12-aaa"), VP("T12", "recarga", "k-t12-aaa", produto="P20")]))
check("reenvio", "recusa por conteúdo diferente não deixa segundo pedido, movimentação nem recebimento",
      out([("userA", VP("T13", "recarga", "k-t13-aaa", valor=125)), ("userA", tentar(VP("T13", "recarga", "k-t13-aaa", valor=130))),
           ("root", contagens("T13"))]) == "1/1/1")
check("reenvio", "mesma venda com 125 e 125.00 é o mesmo conteúdo",
      out([("userA", VP("T14", "recarga", "k-t14-aaa", valor="125")), ("userA", VP("T14", "recarga", "k-t14-aaa", valor="125.00")),
           ("root", contagens("T14"))]) == "1/1/1")
check("reenvio", "nova chave, mesmos produtos e valores = nova venda (duas gravações)",
      out([("userA", VP("T15", "recarga", "k-t15-aaa")), ("userA", VP("T15", "recarga", "k-t15-bbb")), ("root", contagens("T15"))]) == "2/2/2")
check("reenvio", "chave de outra empresa/usuário não é reaproveitada",
      "outra ação" in err([("userA", VP("T16", "recarga", "k-t16-aaa")),
                            ("userA", "SELECT carga_saida('" + U["entregadorA"] + "','P13',1,'k-t16-aaa')")]))
check("reenvio", "sem chave a venda é recusada", "chave" in err([("userA", VP("T17", "recarga", "NULL").replace("'NULL'", "NULL"))]).lower())

# ── Venda na rua
SAIDA = ("userA", "SELECT carga_saida('" + U["entregadorA"] + "','P13',5,'k-rua-saida')")
RUA = lambda nome, tipo, chave, qty=1, valor=125, forma="money", ent=0, rec=0: (
    "entregadorA", f"SELECT entregador_venda_rua(NULL,'{nome}',NULL,'P13',{qty},{valor},'{forma}','{tipo}',{ent},{rec},'t','{chave}')")
check("rua", "'completa' e 'completo' são gravados como 'completa'; carga baixa",
      out([SAIDA, RUA("R1", "completo", "k-r1-aaaa", ent=1), ("root", pedido("R1"))]) == "completa/1/0/false"
      and out([SAIDA, RUA("R1b", "completa", "k-r1b-aaa", ent=1), ("root", pedido("R1b"))]) == "completa/1/0/false")
check("rua", "tipo inválido ou ausente é recusado", "Tipo de venda inválido" in err([SAIDA, RUA("R2", "xyz", "k-r2-aaaa")])
      and "Tipo de venda inválido" in err([SAIDA, ("entregadorA", "SELECT entregador_venda_rua(NULL,'R2',NULL,'P13',1,125,'money',NULL,0,0,'t','k-r2b-aaa')")]))
check("rua", "reenvio com a mesma chave e conteúdo: uma venda, uma baixa de carga",
      out([SAIDA, RUA("R3", "recarga", "k-r3-aaaa", rec=1), RUA("R3", "recarga", "k-r3-aaaa", rec=1),
           ("root", "SELECT (SELECT count(*) FROM orders WHERE client_name='R3')||'/'||(SELECT count(*) FROM carga_movimentos WHERE order_id=(SELECT id FROM orders WHERE client_name='R3') AND delta_cheios<0)")]) == "1/1")
check("rua", "mesma chave com valor diferente é recusada",
      "outro conteúdo" in err([SAIDA, RUA("R4", "recarga", "k-r4-aaaa", valor=125), RUA("R4", "recarga", "k-r4-aaaa", valor=99)]))
check("rua", "cascos negativos recusados", "inválidos" in err([SAIDA, RUA("R5", "recarga", "k-r5-aaaa", rec=-1)]))
check("rua", "sem carga a venda é recusada e nada é gravado",
      out([("entregadorA", tentar(RUA("R6", "recarga", "k-r6-aaaa")[1])), ("root", "SELECT count(*) FROM orders WHERE client_name='R6'")]) == "0")

# ── Permissões continuam valendo
check("perm", "entregador não vende pela portaria", "Sem permissão" in err([("entregadorA", VP("P1", "recarga", "k-p1-aaaa"))]))
check("perm", "operador não vende pela rua", "Sem permissão" in err([("userA", RUA("P2", "recarga", "k-p2-aaaa")[1])]))
check("perm", "outra empresa não vê pedidos da venda",
      out([("userA", VP("P3", "recarga", "k-p3-aaaa")), ("entregadorB", "SELECT count(*) FROM orders WHERE client_name='P3'")]) == "0")
# fixtures.sql concede tudo a 'authenticated' (imita os privilégios padrão do Supabase), então o que vale é o efeito: RLS sem política.
check("perm", "o cliente não enxerga as chaves de reenvio (RLS sem política), mesmo havendo chaves gravadas",
      out([("userA", VP("P4", "recarga", "k-p4-aaaa")), ("userA", "SELECT count(*) FROM acoes_idempotentes")]) == "0"
      and out([("userA", VP("P4", "recarga", "k-p4-aaaa")), ("root", "SELECT count(*) FROM acoes_idempotentes WHERE chave='k-p4-aaaa'")]) == "1")
check("perm", "o cliente não grava chaves diretamente",
      "row-level security" in err([("userA", "INSERT INTO acoes_idempotentes(organization_id,chave,acao,usuario) VALUES (gen_random_uuid(),'k-forjada-1','x',gen_random_uuid())")]))
check("perm", "função interna de reenvio com conteúdo não é chamável pelo cliente",
      "permission denied" in err([("userA", "SELECT _reenvio(gen_random_uuid(),'abcdefghij','x','h')")]))

# ── Concorrência: o mesmo envio simultâneo grava uma vez; conteúdos diferentes com a mesma chave não passam ambos
def par(a, b):
    res = [None, None]
    def run(i, s): res[i] = flow(s, commit=True)
    ts = [threading.Thread(target=run, args=(0, a)), threading.Thread(target=run, args=(1, b))]
    [t.start() for t in ts]; [t.join() for t in ts]
    return res


par([("userA", VP("C1", "recarga", "k-c1-aaaa"))], [("userA", VP("C1", "recarga", "k-c1-aaaa"))])
check("concorrência", "mesmo envio simultâneo: um pedido, uma movimentação, um recebimento", out([("root", contagens("C1"))]) == "1/1/1")
r = par([("userA", VP("C2", "recarga", "k-c2-aaaa", valor=125))], [("userA", VP("C2", "recarga", "k-c2-aaaa", valor=130))])
check("concorrência", "mesma chave com conteúdos diferentes ao mesmo tempo: só um passa, um pedido gravado",
      sum(1 for x in r if x[0]) == 1 and out([("root", contagens("C2"))]) == "1/1/1")

print(f"\n{LABEL}: {sum(1 for r in R if r[2])}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB", "/tmp/g1db") + f"/vendas005_{LABEL}.json", "w"), ensure_ascii=False)
