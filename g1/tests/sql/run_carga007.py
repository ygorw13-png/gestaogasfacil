"""Testes do 007 (carga: devolução, saldo e histórico) sobre 004+005+006.
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, dados fictícios. Rode depois de reset_com007.sh.
Uso: python3 run_carga007.py <URL> <rotulo>"""
import subprocess, sys, json, threading, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "adminB": "b0000000-0000-4000-8000-00000000000a",
     "entregadorB": "b0000000-0000-4000-8000-00000000000d"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
E = U["entregadorA"]


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


ABRE = ("userA", "SELECT registrar_movimentacao_portaria('abertura','P13',20,0,0)")
SAIDA = lambda q, k="k-sai-aaaa": ("userA", f"SELECT carga_saida('{E}','P13',{q},'{k}')")
CID = f"(SELECT id FROM cargas WHERE entregador_id='{E}' AND status='aberta')"
DEV = lambda ch, vz, k, who="userA", p="P13": (who, f"SELECT carga_devolver({CID},'{p}',{ch},{vz},'{k}')")
RES = lambda who="userA", alvo="NULL": (who, f"SELECT coalesce(string_agg(produto||':'||cheios||':'||vazios, ',' ORDER BY produto),'-') FROM carga_resumo({alvo})")
PORT = ("root", f"SELECT _saldo_portaria_cheios('{ORG_A}','P13',data_operacional())")
RUA = lambda q, k, rec=0: ("entregadorA", f"SELECT entregador_venda_rua(NULL,'Cliente Rua 007',NULL,'P13',{q},{125*q},'money','recarga',0,{rec},'t','{k}')")
INIC = [ABRE, SAIDA(5)]

# ── saldo da carga
check("saldo", "operador vê o saldo da carga do entregador após a saída",
      out(INIC + [RES("userA", f"'{E}'")]) == "P13:5:0")
check("saldo", "entregador vê a própria carga sem informar ID", out(INIC + [RES("entregadorA")]) == "P13:5:0")
check("saldo", "entregador não consulta a carga de outro ID", "Sem permissão" in err(INIC + [RES("entregadorA", f"'{U['userA']}'")]))
check("saldo", "operador não consulta entregador de outra empresa", "outra empresa" in err(INIC + [RES("userA", f"'{U['entregadorB']}'")]))
check("saldo", "outra empresa não vê as cargas da empresa A", out(INIC + [RES("adminB")]) == "-")
check("saldo", "venda na rua consome a carga do próprio entregador e recolhe o vazio",
      out(INIC + [RUA(2, "k-rua-aaaa", rec=2), RES("userA", f"'{E}'")]) == "P13:3:2")
check("saldo", "venda na rua acima da carga é recusada sem rastro",
      out(INIC + [("entregadorA", tentar(RUA(6, "k-rua-bbbb")[1])), ("root", "SELECT count(*) FROM orders WHERE client_name='Cliente Rua 007'")]) == "0")

RUAV = lambda q, k: ("entregadorA", f"SELECT entregador_venda_rua(NULL,'Cliente Vas 007',NULL,'P13',{q},{50*q},'money','vasilhame',{q},0,'t','{k}')")
check("rua", "venda de vasilhame sem vazio recolhido na carga é recusada (não consome cheio)",
      "Vazios insuficientes" in err(INIC + [RUAV(1, "k-vas-aaaa")]))
check("rua", "venda de vasilhame consome o vazio recolhido e não toca nos cheios",
      out(INIC + [RUA(1, "k-vas-rua1", rec=1), RUAV(1, "k-vas-bbbb"), RES("userA", f"'{E}'")]) == "P13:4:0")
check("rua", "pedido da venda de vasilhame: tipo, casco entregue e nenhum vazio recebido",
      out(INIC + [RUA(1, "k-vas-rua2", rec=1), RUAV(1, "k-vas-cccc"),
                  ("root", "SELECT tipo_venda||'/'||vasilhames_entregues||'/'||vasilhames_recebidos FROM orders WHERE client_name='Cliente Vas 007'")]) == "vasilhame/1/0")

# ── devolução
check("devolução", "devolução parcial pelo operador: carga diminui e portaria aumenta o mesmo tanto",
      out(INIC + [DEV(2, 0, "k-dev-aaaa"),
                  ("root", f"SELECT (SELECT sum(m.delta_cheios) FROM carga_movimentos m WHERE m.carga_id={CID})||'/'||({PORT[1]})")]) == "3/17")
check("devolução", "devolução total zera a carga do produto", out(INIC + [DEV(5, 0, "k-dev-bbbb"), RES("userA", f"'{E}'")]) == "P13:0:0")
check("devolução", "entregador devolve a sobra da própria carga (registro identificado)",
      out(INIC + [DEV(1, 0, "k-dev-cccc", who="entregadorA"),
                  ("root", "SELECT observacoes FROM movimentacoes_portaria WHERE tipo='retorno_carga' ORDER BY criado_em DESC LIMIT 1")]) == "Retorno de carga (registrado pelo entregador)")
check("devolução", "devolução maior que a carga é recusada e informa o que há",
      "há 5 cheio(s)" in err(INIC + [DEV(6, 0, "k-dev-dddd")]))
check("devolução", "devolução recusada não mexe em carga nem portaria",
      out(INIC + [("userA", tentar(DEV(6, 0, "k-dev-dddd")[1])), ("root", f"SELECT (SELECT sum(delta_cheios) FROM carga_movimentos WHERE carga_id={CID})||'/'||({PORT[1]})")]) == "5/15")
check("devolução", "vazios acima dos recolhidos são recusados (entregador não cria vazio do nada)",
      "Vazios maiores" in err(INIC + [DEV(0, 1, "k-dev-eeee", who="entregadorA")]))
check("devolução", "vazios recolhidos na rua voltam para a portaria",
      out(INIC + [RUA(1, "k-rua-cccc", rec=1), DEV(0, 1, "k-dev-ffff"),
                  ("root", "SELECT delta_vazios FROM movimentacoes_portaria WHERE tipo='retorno_carga' ORDER BY criado_em DESC LIMIT 1")]) == "1")
check("devolução", "produto com nome livre ('Botijão P13') é normalizado",
      out(INIC + [DEV(1, 0, "k-dev-gggg", p="Botijão P13"), ("root", "SELECT produto FROM movimentacoes_portaria WHERE tipo='retorno_carga' ORDER BY criado_em DESC LIMIT 1")]) == "P13")
check("devolução", "quantidade zero, negativa ou produto inválido é recusado",
      "Quantidade inválida" in err(INIC + [DEV(0, 0, "k-dev-hhhh")]) and "Quantidade inválida" in err(INIC + [DEV(-1, 0, "k-dev-iiii")])
      and "sem controle" in err(INIC + [DEV(1, 0, "k-dev-jjjj", p="Lenha")]))
check("devolução", "operador de outra empresa não devolve carga da empresa A", "inexistente" in err(INIC + [DEV(1, 0, "k-dev-kkkk", who="adminB")]))
check("devolução", "devolução vai para a data operacional (Bahia)",
      out(INIC + [DEV(1, 0, "k-dev-llll"), ("root", "SELECT data_operacao = data_operacional() FROM movimentacoes_portaria WHERE tipo='retorno_carga' ORDER BY criado_em DESC LIMIT 1")]) == "t")
check("devolução", "devolução sem chave é recusada", "chave" in err(INIC + [("userA", f"SELECT carga_devolver({CID},'P13',1,0,NULL)")]).lower())

# ── reenvio
check("reenvio", "mesma chave e mesmo conteúdo: uma devolução",
      out(INIC + [DEV(2, 0, "k-dev-mmmm"), DEV(2, 0, "k-dev-mmmm"), ("root", f"SELECT count(*) FROM carga_movimentos WHERE tipo='devolucao'")]) == "1")
check("reenvio", "mesma chave com outra quantidade é recusada", "outro conteúdo" in err(INIC + [DEV(2, 0, "k-dev-nnnn"), DEV(3, 0, "k-dev-nnnn")]))

# ── histórico
# (na mesma transação todos os movimentos têm o mesmo criado_em: confere o conjunto, não a ordem)
check("histórico", "histórico mostra saída, venda na rua (com cliente) e devolução",
      out(INIC + [RUA(1, "k-rua-dddd"), DEV(1, 0, "k-dev-oooo"),
                  ("userA", f"SELECT string_agg(tipo||':'||delta_cheios||':'||coalesce(cliente,'-'), ',' ORDER BY tipo) FROM carga_historico('{E}', 1)")])
      == "consumo_venda_rua:-1:Cliente Rua 007,devolucao:-1:-,saida_portaria:5:-")
check("histórico", "entregador vê o próprio histórico", out(INIC + [("entregadorA", "SELECT count(*) FROM carga_historico(NULL, 7)")]) == "1")
check("histórico", "entregador não vê histórico de outro", "Sem permissão" in err(INIC + [("entregadorA", f"SELECT * FROM carga_historico('{U['userA']}', 7)")]))
check("histórico", "período fora de 1 a 62 dias é recusado", "Período inválido" in err([("userA", "SELECT * FROM carga_historico(NULL, 0)")]))
check("histórico", "funções internas não ficam expostas", "permission denied" in err([("userA", f"SELECT _carga_alvo(NULL)")]))


# ── concorrência
def par(a, b):
    res = [None, None]
    def run(i, s): res[i] = flow(s, commit=True)
    ts = [threading.Thread(target=run, args=(0, a)), threading.Thread(target=run, args=(1, b))]
    [t.start() for t in ts]; [t.join() for t in ts]
    return res


assert flow(INIC, commit=True)[0]
r = par([DEV(3, 0, "k-cc-aaaa")], [DEV(3, 0, "k-cc-bbbb", who="entregadorA")])
check("concorrência", "duas devoluções de 3 com carga 5 ao mesmo tempo: só uma passa e a carga não fica negativa",
      sum(1 for x in r if x[0]) == 1 and out([RES("userA", f"'{E}'")]) == "P13:2:0")
r = par([DEV(2, 0, "k-cc-cccc")], [RUA(2, "k-cc-rua1")])
check("concorrência", "devolução e venda na rua disputando os 2 cheios: só uma passa",
      sum(1 for x in r if x[0]) == 1 and out([RES("userA", f"'{E}'")]).startswith("P13:0:"))

print(f"\n{LABEL}: {sum(1 for r in R if r[2])}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB", "/tmp/g1db") + f"/carga007_{LABEL}.json", "w"), ensure_ascii=False)
