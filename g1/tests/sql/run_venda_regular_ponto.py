"""Venda Regular em Nota promissória para cliente comum e para cliente cadastrado como ponto (R$ 240, 2 P13).
Banco DESCARTÁVEL em 127.0.0.1, só dados fictícios. Rode depois de reset_com015.sh com_abertura.
Uso: python3 run_venda_regular_ponto.py <URL>"""
import subprocess, sys, json
URL = sys.argv[1]
assert "127.0.0.1" in URL, "somente banco local descartável"
UA = "a0000000-0000-4000-8000-00000000000b"
ORG = "0a000000-0000-4000-8000-000000000000"
CLI = "c1c1c1c1-0000-4000-8000-0000000000c1"
PT = "d1d1d1d1-0000-4000-8000-0000000000d1"
claims = json.dumps({"sub": UA, "role": "authenticated"})
USER = f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"


def psql(body):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{body}\nROLLBACK;"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, p.stdout.strip().splitlines(), p.stderr.strip()[:300]


SETUP = f"""INSERT INTO clients(id, organization_id, name) VALUES ('{CLI}','{ORG}','Cliente Ficticio');
INSERT INTO pontos_revenda(id, organization_id, nome, povoado) VALUES ('{PT}','{ORG}','Ponto Ficticio','Povoado X');
"""
SALDO = f"SELECT 'saldo='||coalesce(sum(delta_cheios),0)||'/'||coalesce(sum(delta_vazios),0) FROM movimentacoes_portaria WHERE organization_id='{ORG}' AND produto='P13';"
VP = lambda cid, nome, valor, k: f"SELECT 'id='||venda_portaria({cid},'{nome}','GLP P13',2,{valor},'promissoria','recarga',true,NULL,'Venda registrada na portaria','{k}',NULL,false);"
CONTA = lambda nome: (f"SELECT 'conta='||count(*)||'|'||coalesce(sum(o.price),0)||'|'||(SELECT count(*) FROM promissory_notes p JOIN orders x ON x.id=p.order_id WHERE x.client_name='{nome}' AND p.value=240 AND p.status='pending')"
                      f"||'|'||(SELECT count(*) FROM recebimentos r JOIN orders x ON x.id=r.order_id WHERE x.client_name='{nome}')"
                      f"||'|'||(SELECT count(*) FROM conta_botijoes WHERE parceiro_id='{PT}') FROM orders o WHERE o.client_name='{nome}';")
R = []


def check(name, cond, info=None):
    R.append(bool(cond)); print(f"{'PASS' if cond else 'FAIL'} {name}" + ("" if cond else f"  -> {info}"))


def caso(rot, cid, nome, k):
    ok, out, er = psql("RESET ROLE;\n" + SETUP + SALDO + USER + VP(cid, nome, 240, k) + VP(cid, nome, 240, k) + "RESET ROLE;\n" + SALDO + CONTA(nome))
    if not ok:
        check(f"{rot}: venda gravada", False, er); return
    s0, id1, id2, s1, conta = out
    check(f"{rot}: reenvio devolve a mesma venda", id1 == id2, (id1, id2))
    c0, v0 = map(int, s0[6:].split("/")); c1, v1 = map(int, s1[6:].split("/"))
    check(f"{rot}: estoque -2 cheios +2 vazios", (c1 - c0, v1 - v0) == (-2, 2), (s0, s1))
    check(f"{rot}: 1 venda R$ 240, 1 promissória R$ 240 pendente, 0 recebimento, 0 lançamento na ficha", conta == "conta=1|240.00|1|0|0", conta)


caso("cliente comum", f"'{CLI}'", "Cliente Ficticio", "k-vrp-cli")
caso("cliente ponto", "NULL", "Ponto Ficticio (Povoado X)", "k-vrp-pto")

# Falhas: nada gravado
for rot, cid, valor, msg in [("id de ponto enviado como cliente", f"'{PT}'", 240, "outra empresa"),
                             ("promissória com total zero", "NULL", 0, "maior que zero")]:
    body = ("RESET ROLE;\n" + SETUP + USER + VP(cid, "Falha Ficticia", valor, f"k-vrp-f-{valor}") )
    ok, out, er = psql(body)
    check(f"falha ({rot}) recusada com motivo", (not ok) and msg in er, er)
    # verificação de gravação parcial: tenta dentro de savepoint e confere que nada ficou
    body2 = ("RESET ROLE;\n" + SETUP + USER + "SAVEPOINT s;\nDO $$ BEGIN BEGIN PERFORM venda_portaria(" + cid + ",'Falha Ficticia','GLP P13',2," + str(valor)
             + ",'promissoria','recarga',true,NULL,'x','k-vrp-g-" + str(valor) + "',NULL,false); EXCEPTION WHEN others THEN NULL; END; END $$;\nRESET ROLE;\n"
             "SELECT (SELECT count(*) FROM orders WHERE client_name='Falha Ficticia')||'|'||(SELECT count(*) FROM promissory_notes WHERE client_name='Falha Ficticia')||'|'||(SELECT count(*) FROM movimentacoes_portaria WHERE cliente_nome='Falha Ficticia')||'|'||(SELECT count(*) FROM acoes_idempotentes WHERE chave='k-vrp-g-" + str(valor) + "');")
    ok, out, er = psql(body2)
    check(f"falha ({rot}) sem gravação parcial", ok and out and out[-1] == "0|0|0|0", (out, er))

print(f"venda_regular_ponto: {sum(R)}/{len(R)}")
sys.exit(0 if all(R) else 1)
