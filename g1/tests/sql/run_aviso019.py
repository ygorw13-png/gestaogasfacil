"""Testes do 019 (aviso mínimo ao entregador: número do pedido + link). Banco DESCARTÁVEL em 127.0.0.1, só dados fictícios.
Rode depois de reset_com019.sh com_abertura. Uso: python3 run_aviso019.py <URL>"""
import subprocess, sys, json
URL = sys.argv[1]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "entregador2A": "a0000000-0000-4000-8000-0000000000f2",
     "adminB": "b0000000-0000-4000-8000-00000000000a"}
E1, E2 = U["entregadorA"], U["entregador2A"]
ORG = "0a000000-0000-4000-8000-000000000000"
TEL = "557533330000"
LINK = "https://gestaogasfacil.lovable.app/entregador/entregas?pedido="


def as_user(u):
    if u == "root": return "RESET ROLE;\n"
    if u == "service": return "RESET ROLE; SET LOCAL ROLE service_role;\n"
    c = json.dumps({"sub": U[u], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{c}', true) \\g /dev/null\n"


def flow(steps, commit=False):
    script = "SET TimeZone='UTC';\nBEGIN;\n" + "".join(as_user(u) + s + ";\n" for u, s in steps) + ("COMMIT;" if commit else "ROLLBACK;")
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:400]


out = lambda s, c=False: (lambda r: r[1] if r[0] else "ERRO:" + r[2])(flow(s, c))
R = []


def check(name, cond, info=None):
    R.append(bool(cond)); print(f"{'PASS' if cond else 'FAIL'} {name}" + ("" if cond else f"  -> {info}"))


H = lambda expr: f"encode(sha256(convert_to({expr},'UTF8')),'hex')"
GV = lambda k: f"current_setting('t.{k}')"
SETV = lambda k, expr: f"SELECT set_config('t.{k}', ({expr})::text, false) \\g /dev/null"
ORD = "(SELECT id FROM orders WHERE client_name='Cliente Aviso')"
OID = ("root", SETV("oid", ORD))
ESPERADO = lambda: f"'Nova entrega #' || upper(left(replace({GV('oid')}, '-', ''), 8)) || ' — abrir pedido' || chr(10) || '{LINK}' || {GV('oid')}"
BASE = [("root", f"INSERT INTO colaboradores(nome,cargo,telefone,data_admissao,situacao,organization_id,user_id) VALUES "
                 f"('Entregador A','entregador','(75) 99999-0001',current_date,'ativo','{ORG}','{E1}'),"
                 f"('Entregador Dois A','entregador','75 98888-0002',current_date,'ativo','{ORG}','{E2}')"),
        ("userA", f"INSERT INTO orders(user_id,organization_id,client_name,client_phone,address,product,quantity,price,payment_method,notes,tipo_venda,origem_venda) "
                  f"VALUES ('{U['userA']}','{ORG}','Cliente Aviso','(75) 97777-1234','{{\"street\":\"Rua Ficticia Aviso\",\"number\":\"77\",\"neighborhood\":\"Bairro Teste\"}}',"
                  f"'GLP P13',2,240,'money','Portão azul','recarga','pedido')"), OID]
PRONTO = BASE + [("adminA", "SELECT whatsapp_provedor_definir('desktop')"), ("adminA", "SELECT whatsapp_desktop_telefone_definir('75 3333-0000')"),
                 ("adminA", SETV("cod", "whatsapp_desktop_gerar_pareamento()->>'pairing_code'")),
                 ("service", f"SELECT whatsapp_desktop_parear({H(GV('cod'))},'PC Teste',{H(repr('tokA'))},'10.0.0.1')"),
                 ("service", f"SELECT whatsapp_desktop_heartbeat({H(repr('tokA'))},'connected','{TEL}',false,'1.0.0','10.0.0.1')"),
                 ("adminA", "SELECT whatsapp_desktop_ativar(true)")]
ATR = lambda e=E1, k="k-av19-a": ("userA", f"SELECT atribuir_entrega_aviso({ORD},'{e}',false,'{k}','app_whatsapp')")
REA = lambda e=E2, k="k-av19-r": ("userA", f"SELECT reatribuir_entrega_aviso({ORD},'{e}','Saiu de rota',false,'{k}','app_whatsapp')")
POLL = ("service", SETV("job", f"whatsapp_desktop_poll({H(repr('tokA'))},'{TEL}','10.0.0.1')"))
JOB = lambda campo: f"({GV('job')}::jsonb->'job'->>'{campo}')"
VE = lambda u: (u, f"SELECT count(*) FROM orders WHERE id={ORD}")
SEM_DADOS = ["Cliente Aviso", "97777", "Rua Ficticia", "Bairro Teste", "GLP", "240", "Dinheiro", "Portão", "R$", "reservado"]

# --- texto mínimo ---
r = out(BASE + [("root", f"SELECT (_wd_texto({ORD}) = {ESPERADO()})::text || '|' || length(_wd_texto({ORD}))")])
check("Texto = 'Nova entrega #NUM — abrir pedido' + quebra + link HTTPS do pedido", r.startswith("true|"), r)
t = out(BASE + [("root", f"SELECT replace(_wd_texto({ORD}), chr(10), ' ')")])
check("Texto sem cliente/telefone/endereço/produto/valor/forma/observação", t and not any(x in t for x in SEM_DADOS), t)
check("Link só com o identificador do pedido", t.split(" ")[-1].startswith(LINK) and len(t.split(" ")[-1]) == len(LINK) + 36, t)
r = out(BASE + [("root", f"SET session_replication_role=replica; UPDATE orders SET payment_method='agregado', price=97 WHERE id={ORD}; SET session_replication_role=origin"),
                ("root", f"SELECT (_wd_texto({ORD}) = {ESPERADO()})::text")])
check("Retirada de agregado: mesmo aviso mínimo, sem preço", r == "true", r)
check("_wd_texto continua fora do alcance de usuários do app", "permission denied" in out(BASE + [("userA", f"SELECT _wd_texto({ORD})")]))

# --- protocolo do PC inalterado ---
r = out(PRONTO + [ATR(), POLL, ("root", f"SELECT (SELECT string_agg(k, ',' ORDER BY k) FROM jsonb_object_keys({GV('job')}::jsonb->'job') k) || '|' || "
                                        f"({JOB('text')} = {ESPERADO()})::text || '|' || {JOB('to')}")])
check("Poll v1: mesmas chaves, texto mínimo, destino = telefone do entregador", r == "attempt_token,expected_phone,id,text,to|true|5575999990001", r)
r = out(PRONTO + [ATR(), REA(), POLL, ("root", f"SELECT ({JOB('text')} = {ESPERADO()})::text || '|' || {JOB('to')} || '|' || "
                                               f"(SELECT string_agg(status, ',' ORDER BY criado_em) FROM whatsapp_envios WHERE order_id={ORD})")])
check("Reatribuição: aviso antigo cancelado; novo entregador recebe o mesmo formato", r == "true|5575988880002|cancelado,enviando", r)

# --- acesso pelo link (regras existentes: login + RLS) ---
check("Entregador responsável abre o pedido", out(BASE + [ATR(), VE("entregadorA")]) == "1")
check("Outro entregador da empresa não abre", out(BASE + [ATR(), VE("entregador2A")]) == "0")
check("Após reatribuição: antigo perde acesso, novo ganha", out(BASE + [ATR(), REA(), VE("entregadorA")]) == "0" and out(BASE + [ATR(), REA(), VE("entregador2A")]) == "1")
check("Conta desativada perde acesso", out(BASE + [ATR(), ("root", f"SET session_replication_role=replica; UPDATE profiles SET ativo=false WHERE id='{E1}'; SET session_replication_role=origin"), VE("entregadorA")]) == "0")
check("Papel entregador removido perde acesso", out(BASE + [ATR(), ("root", f"DELETE FROM user_roles WHERE user_id='{E1}' AND role='entregador'"), VE("entregadorA")]) == "0")
check("Outra empresa não abre", out(BASE + [ATR(), VE("adminB")]) == "0")
check("Administrador e operador mantêm acesso legítimo", out(BASE + [ATR(), REA(), VE("adminA")]) == "1" and out(BASE + [ATR(), REA(), VE("userA")]) == "1")

# --- feedback ao cliente: atribuição não dispara nada ao cliente ---
r = out(PRONTO + [ATR(), REA(), ("root", "SELECT (SELECT count(*) FROM whatsapp_mensagens) || '|' || (SELECT count(*) FROM contatos_recompra) || '|' || "
                                         f"(SELECT count(*) FROM whatsapp_envios WHERE order_id={ORD} AND telefone LIKE '%977771234')")])
check("Atribuir/reatribuir não cria mensagem nem contato de pós-venda ao cliente", r == "0|0|0", r)

print(f"\n{sum(R)}/{len(R)} PASS")
