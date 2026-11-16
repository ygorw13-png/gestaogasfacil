"""Testes do 018 (provedor Aplicativo do PC para avisos de WhatsApp). Banco DESCARTÁVEL em 127.0.0.1, só dados fictícios.
Rode depois de reset_com018.sh com_abertura. Uso: python3 run_desktop018.py <URL>"""
import subprocess, sys, json, threading, uuid
URL = sys.argv[1]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "adminB": "b0000000-0000-4000-8000-00000000000a"}
E1, E2 = U["entregadorA"], "a0000000-0000-4000-8000-0000000000f2"
ORG, ORG_B = "0a000000-0000-4000-8000-000000000000", "0b000000-0000-4000-8000-000000000000"
TEL = "557533330000"


def as_user(u):
    if u == "root": return "RESET ROLE;\n"
    if u == "service": return "RESET ROLE; SET LOCAL ROLE service_role;\n"
    if u == "anon": return "RESET ROLE; SET LOCAL ROLE anon;\n"
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
ORD = "(SELECT id FROM orders WHERE client_name='Cliente PC')"
BASE = [("root", f"INSERT INTO colaboradores(nome,cargo,telefone,data_admissao,situacao,organization_id,user_id) VALUES "
                 f"('Entregador A','entregador','(75) 99999-0001',current_date,'ativo','{ORG}','{E1}'),"
                 f"('Entregador Dois A','entregador','75 98888-0002',current_date,'ativo','{ORG}','{E2}')"),
        ("userA", f"INSERT INTO orders(user_id,organization_id,client_name,address,product,quantity,price,payment_method,tipo_venda,origem_venda) "
                  f"VALUES ('{U['userA']}','{ORG}','Cliente PC','{{\"street\":\"Rua Ficticia\",\"number\":\"10\"}}','GLP P13',2,240,'money','recarga','pedido')")]
PROV = lambda p="desktop", who="adminA": (who, f"SELECT whatsapp_provedor_definir('{p}')->>'provedor'")
FONE = lambda t="75 3333-0000", who="adminA": (who, f"SELECT whatsapp_desktop_telefone_definir('{t}')->>'telefone_esperado'")
GERA = ("adminA", SETV("cod", "whatsapp_desktop_gerar_pareamento()->>'pairing_code'"))
PAIR = lambda tok="tokA", nome="PC Portaria", ip="10.0.0.1", cod=GV("cod"): ("service", f"SELECT whatsapp_desktop_parear({H(cod)},'{nome}',{H(repr(tok))},'{ip}')")
HB = lambda tok="tokA", st="connected", tel=TEL, pausado="false": ("service", f"SELECT whatsapp_desktop_heartbeat({H(repr(tok))},'{st}',{('NULL' if tel is None else repr(tel))},{pausado},'1.0.0','10.0.0.1')")
ATIVA = lambda on="true", who="adminA": (who, f"SELECT whatsapp_desktop_ativar({on})->>'envio_ativo'")
ATR = lambda e=E1, k="k-pc-atrib-a": ("userA", f"SELECT atribuir_entrega_aviso({ORD},'{e}',false,'{k}','app_whatsapp')")
REA = lambda e=E2, k="k-pc-reatrib-r": ("userA", f"SELECT reatribuir_entrega_aviso({ORD},'{e}','Saiu de rota',false,'{k}','app_whatsapp')")
POLL = lambda tok="tokA", tel=TEL: ("service", f"SELECT whatsapp_desktop_poll({H(repr(tok))},'{tel}','10.0.0.1')")
POLLCAP = lambda tok="tokA", tel=TEL: ("service", SETV("job", f"whatsapp_desktop_poll({H(repr(tok))},'{tel}','10.0.0.1')"))
JOB = lambda campo: f"({GV('job')}::jsonb->'job'->>'{campo}')"
BEGIN = lambda tok="tokA", tel=TEL, att=None, job=None: ("service", f"SELECT whatsapp_desktop_begin({H(repr(tok))},{job or JOB('id')}::uuid,{att or JOB('attempt_token')},'{tel}','10.0.0.1')->>'allowed'")
RES = lambda out_="sent", tok="tokA", att=None: ("service", f"SELECT whatsapp_desktop_resultado({H(repr(tok))},{JOB('id')}::uuid,{att or JOB('attempt_token')},'{out_}','wamid.FICT',NULL,'10.0.0.1')")
ST = ("root", f"SELECT string_agg(provedor||':'||status, ',' ORDER BY criado_em) FROM whatsapp_envios WHERE order_id={ORD}")
PRONTO = BASE + [PROV(), FONE(), GERA, PAIR(), HB(), ATIVA()]

# --- configuração e pareamento ---
check("Operador não troca provedor", "Só o administrador" in out(BASE + [PROV(who="userA")]))
check("Número esperado normalizado E164 BR", out(BASE + [PROV(), FONE()]) == TEL)
check("Trocar provedor desliga o envio",
      out(PRONTO + [PROV("meta"), ("root", f"SELECT envio_ativo||'|'||provedor FROM whatsapp_config WHERE organization_id='{ORG}'")]) == "false|meta")
check("Trocar número esperado desliga o envio",
      out(PRONTO + [FONE("75 3333-1111"), ("root", f"SELECT envio_ativo::text FROM whatsapp_config WHERE organization_id='{ORG}'")]) == "false")
r = out(BASE + [PROV(), FONE(), ("adminA", f"UPDATE whatsapp_config SET envio_ativo=true WHERE organization_id='{ORG}'")])
check("Ligar envio do PC por escrita direta é recusado", "só é ligado em Configurações" in r, r)
r = out(BASE + [PROV(), FONE(), ATIVA()])
check("Não liga envio sem PC pareado", "Nenhum aplicativo do PC pareado" in r, r)
r = out(BASE + [PROV(), FONE(), GERA, ("root", "SELECT length(" + GV("cod") + ")||'|'||(SELECT count(*) FROM whatsapp_desktop_pareamentos WHERE codigo_hash=" + GV("cod") + ")||'|'||(SELECT count(*) FROM whatsapp_desktop_pareamentos WHERE codigo_hash=" + H(GV("cod")) + ")")])
check("Código >=128 bits, banco guarda só o hash", r == "64|0|1", r)
r = out(BASE + [PROV(), FONE(), GERA, PAIR()])
check("Pareamento devolve device_id, empresa e número", '"expected_phone": "' + TEL + '"' in r and "device_id" in r, r)
r = out(BASE + [PROV(), FONE(), GERA, PAIR(), PAIR(tok="tokB")])
check("Replay do código recusado (uso único)", '"status": 401' in r, r)
r = out(BASE + [PROV(), FONE(), GERA, ("root", "UPDATE whatsapp_desktop_pareamentos SET expira_em=now()-interval '1 second'"), PAIR()])
check("Código expirado recusado", '"status": 401' in r, r)
r = out(BASE + [PROV(), FONE(), GERA, PAIR(), GERA])
check("Segundo PC bloqueado enquanto há um ativo", "Revogue-o antes" in r, r)
r = out(BASE + [PROV(), FONE()] + [PAIR(cod="'errado" + str(i) + "'") for i in range(10)] + [PAIR(cod="'errado-x'")])
check("Limite de tentativas de pareamento por origem (429)", '"status": 429' in r, r)
r = out(PRONTO + [("root", "SELECT count(*) FROM whatsapp_desktop_dispositivos WHERE token_hash=" + H(repr("tokA")) + "||'' OR token_hash='tokA'"),
                  ("root", "SELECT (SELECT count(*) FROM whatsapp_desktop_dispositivos WHERE token_hash='tokA')||'|'||(SELECT count(*) FROM whatsapp_desktop_dispositivos WHERE token_hash=" + H(repr("tokA")) + ")")])
check("Token do dispositivo guardado só como hash", r == "0|1", r)
for who in ("userA", "adminA"):
    r = out(PRONTO + [(who, "SELECT count(*) FROM whatsapp_desktop_dispositivos")])
    check(f"{who} não lê tabela de dispositivos/hashes", "permission denied" in r, r)
r = out(PRONTO + [ATR(), ("userA", f"SELECT tentativa_hash FROM whatsapp_envios WHERE order_id={ORD}")])
check("Operador não lê hash da tentativa", "permission denied" in r, r)
r = out(PRONTO + [("adminA", "SELECT whatsapp_desktop_status()::text")])
check("Status do admin sem hashes", "hash" not in r and '"pronto": true' in r, r)
r = out(PRONTO + [("adminB", "SELECT coalesce(whatsapp_desktop_status()->>'dispositivo','sem')")])
check("Outra empresa não vê o PC", r == "sem", r)
r = out(PRONTO + [("anon", f"SELECT whatsapp_desktop_poll('x','{TEL}','ip')")])
check("Funções do dispositivo negadas a anon/usuários", "permission denied" in r, r)

# --- fila ---
check("Atribuição com PC ativo entra na fila do PC", out(PRONTO + [ATR(), ST]) == "desktop:aguardando")
check("Com PC selecionado e desligado, falha registrada (sem fila parada)",
      out(BASE + [PROV(), FONE(), ATR(), ST]) == "desktop:falha")
r = out(PRONTO + [ATR(), POLL()])
check("Poll entrega destinatário/texto derivados do pedido", '"to": "5575999990001"' in r and "Cliente PC" in r and "R$ 240,00" in r and "attempt_token" in r, r)
check("Telefone do poll diferente do esperado: sem job", '"job": null' in out(PRONTO + [ATR(), POLL(tel="557599990000")]))
check("Pausado: sem job", '"job": null' in out(PRONTO + [ATR(), HB(pausado="true"), POLL()]))
check("Desconectado: sem job", '"job": null' in out(PRONTO + [ATR(), HB(st="disconnected"), POLL()]))
check("Heartbeat com outro número: sem job", '"job": null' in out(PRONTO + [ATR(), HB(tel="557599990000"), POLL()]))
check("Sem contato há mais de 45s: sem job", '"job": null' in out(PRONTO + [ATR(), ("root", "UPDATE whatsapp_desktop_dispositivos SET ultimo_contato=now()-interval '46 seconds'"), POLL()]))
check("Envio desligado: sem job", '"job": null' in out(PRONTO + [ATR(), ATIVA("false"), POLL()]))
check("Desligar cancela o que não começou", out(PRONTO + [ATR(), ATIVA("false"), ST]) == "desktop:cancelado")
check("Trocar para Meta cancela pendentes do PC", out(PRONTO + [ATR(), POLLCAP(), PROV("meta"), ST]) == "desktop:cancelado")
check("Envio antigo da Meta nunca vai para o PC",
      '"job": null' in out(BASE + [ATR(), ("root", f"UPDATE whatsapp_envios SET status='falha' WHERE order_id={ORD}"), PROV(), FONE(), GERA, PAIR(), HB(), ATIVA(), POLL()]))
r = out(PRONTO + [ATR(), ("service", f"SELECT whatsapp_envio_reservar((SELECT id FROM whatsapp_envios WHERE order_id={ORD}), false)->>'motivo'")])
check("Envio da Meta recusa aviso do PC", "Aplicativo do PC" in r, r)

# --- begin / result ---
check("Begin válido marca iniciado", out(PRONTO + [ATR(), POLLCAP(), BEGIN(), ("root", f"SELECT status||'|'||(iniciado_em IS NOT NULL)||'|'||tentativas FROM whatsapp_envios WHERE order_id={ORD}")]) == "enviando|true|1")
check("Segundo begin da mesma tentativa negado", out(PRONTO + [ATR(), POLLCAP(), BEGIN(), BEGIN()]) == "false")
check("Begin com attempt_token errado negado", out(PRONTO + [ATR(), POLLCAP(), BEGIN(att="'x'")]) == "false")
check("Begin com telefone errado negado", out(PRONTO + [ATR(), POLLCAP(), BEGIN(tel="557599990000")]) == "false")
check("Begin após pausa negado", out(PRONTO + [ATR(), POLLCAP(), HB(pausado="true"), BEGIN()]) == "false")
check("Reatribuição antes do begin cancela e nega",
      out(PRONTO + [ATR(), POLLCAP(), REA(), BEGIN(), ST]) == "desktop:cancelado,desktop:aguardando")
check("Cancelamento do pedido antes do begin nega",
      out(PRONTO + [ATR(), POLLCAP(), ("root", f"SET session_replication_role=replica; UPDATE orders SET status='cancelled' WHERE id={ORD}; SET session_replication_role=origin"), BEGIN(), ST]) == "desktop:cancelado")
check("Revogação antes do begin: 401 e cancelado",
      '"status": 401' in out(PRONTO + [ATR(), POLLCAP(), ("adminA", "SELECT whatsapp_desktop_revogar()"), ("service", f"SELECT whatsapp_desktop_begin({H(repr('tokA'))},{JOB('id')}::uuid,{JOB('attempt_token')},'{TEL}','ip')")]))
check("Revogado durante envio vira incerto", out(PRONTO + [ATR(), POLLCAP(), BEGIN(), ("adminA", "SELECT whatsapp_desktop_revogar()"), ST]) == "desktop:incerto")
check("Lease antes do begin vencido: volta à fila",
      '"job": {' in out(PRONTO + [ATR(), POLLCAP(), ("root", "UPDATE whatsapp_envios SET lease_ate=now()-interval '1 second'"), POLL()]))
check("Lease após begin vencido: INCERTO sem reenvio automático",
      out(PRONTO + [ATR(), POLLCAP(), BEGIN(), ("root", "UPDATE whatsapp_envios SET lease_ate=now()-interval '1 second'"), POLL(), ST]) == "desktop:incerto")
check("Um job por vez: iniciado em aberto bloqueia o próximo",
      '"job": null' in out(PRONTO + [ATR(), POLLCAP(), BEGIN(), ("userA", f"INSERT INTO orders(user_id,organization_id,client_name,address,product,quantity,price,payment_method,tipo_venda,origem_venda) VALUES ('{U['userA']}','{ORG}','Cliente PC 2','{{}}','GLP P13',1,120,'money','recarga','pedido')"),
                                     ("userA", f"SELECT atribuir_entrega_aviso((SELECT id FROM orders WHERE client_name='Cliente PC 2'),'{E1}',false,'k-pc-atrib-2','app_whatsapp')"), POLL()]))
check("Resultado enviado registrado (nunca entregue/lido)", out(PRONTO + [ATR(), POLLCAP(), BEGIN(), RES(), ST]) == "desktop:enviado")
check("Resultado idempotente (mesma tentativa)", '"ok": true' in out(PRONTO + [ATR(), POLLCAP(), BEGIN(), RES(), RES()]))
check("Resultado divergente recusado (409)", '"status": 409' in out(PRONTO + [ATR(), POLLCAP(), BEGIN(), RES(), RES("failed")]))
check("Sent sem begin recusado", '"status": 409' in out(PRONTO + [ATR(), POLLCAP(), RES()]))
check("Resultado após prazo (incerto) aceito da mesma tentativa",
      out(PRONTO + [ATR(), POLLCAP(), BEGIN(), ("root", "UPDATE whatsapp_envios SET lease_ate=now()-interval '1 second'"), POLL(), RES(), ST]) == "desktop:enviado")
check("Status inválido para entregue/lido inexistente", '"status": 400' in out(PRONTO + [ATR(), POLLCAP(), BEGIN(), RES("delivered")]))

# --- empresa cruzada ---
r = out(PRONTO + [ATR(), POLLCAP(),
     ("adminB", "SELECT whatsapp_provedor_definir('desktop')"), ("adminB", "SELECT whatsapp_desktop_telefone_definir('71 3333-0000')"),
     ("adminB", SETV("codb", "whatsapp_desktop_gerar_pareamento()->>'pairing_code'")), PAIR(tok="tokB", cod=GV("codb")),
     ("service", f"SELECT whatsapp_desktop_begin({H(repr('tokB'))},{JOB('id')}::uuid,{JOB('attempt_token')},'557133330000','ip')")])
check("Dispositivo de outra empresa não acessa o job (404)", '"status": 404' in r, r)

# --- reenvio manual ---
INC = PRONTO + [ATR(), POLLCAP(), BEGIN(), RES("uncertain")]
r = out(INC + [("userA", f"SELECT whatsapp_desktop_reenviar((SELECT id FROM whatsapp_envios WHERE order_id={ORD}), false, 'k-reenvio-1')")])
check("Reenvio de incerto exige confirmação", "confirme que conferiu" in r, r)
r = out(INC + [("userA", f"SELECT whatsapp_desktop_reenviar((SELECT id FROM whatsapp_envios WHERE order_id={ORD} AND reenvio_de IS NULL), true, 'k-reenvio-1')"),
               ("userA", f"SELECT whatsapp_desktop_reenviar((SELECT id FROM whatsapp_envios WHERE order_id={ORD} AND reenvio_de IS NULL), true, 'k-reenvio-1')"),
               ("root", f"SELECT count(*)||'|'||count(*) FILTER (WHERE reenvio_de IS NOT NULL AND status='aguardando') FROM whatsapp_envios WHERE order_id={ORD}")])
check("Reenvio confirmado cria NOVO job ligado ao anterior, uma vez", r == "2|1", r)

# --- sigilo de agregados ---
r = out(BASE + [("root", f"SELECT _wd_texto(id) FROM orders WHERE client_name='Cliente PC'"), ])
r2 = out(BASE + [("root", f"SET session_replication_role=replica; UPDATE orders SET payment_method='agregado', price=97 WHERE client_name='Cliente PC'; SET session_replication_role=origin"),
                 ("root", f"SELECT _wd_texto(id) FROM orders WHERE client_name='Cliente PC'")])
check("Texto do PC nunca mostra preço de retirada de agregado", "R$" not in r2 and "reservado ao administrador" in r2 and "R$ 240,00" in r, r2)

# --- claim concorrente (dados confirmados, duas sessões ao mesmo tempo) ---
KC = "k-pc-conc-" + uuid.uuid4().hex[:8]
flow([("root", "DELETE FROM whatsapp_desktop_limites")], True)
ok = out(PRONTO + [ATR(k=KC)], True)
res = [None, None]
def worker(i):
    res[i] = out([("service", f"SELECT whatsapp_desktop_poll({H(repr('tokA'))},'{TEL}','ip')->'job'->>'attempt_token'")], True)
ts = [threading.Thread(target=worker, args=(i,)) for i in range(2)]
[t.start() for t in ts]; [t.join() for t in ts]
alow = [out([("service", f"SELECT whatsapp_desktop_begin({H(repr('tokA'))},(SELECT id FROM whatsapp_envios WHERE chave='{KC}'),'{t}','{TEL}','ip')->>'allowed'")], True) for t in res if t]
r = out([("root", f"SELECT count(*) FROM whatsapp_envios WHERE chave='{KC}' AND status='enviando'")])
check("Claim concorrente: só uma tentativa consegue begin", alow.count("true") == 1 and r == "1", (res, alow, r))
flow([("root", f"DELETE FROM whatsapp_envios WHERE organization_id='{ORG}'; DELETE FROM whatsapp_desktop_dispositivos; DELETE FROM whatsapp_desktop_pareamentos; DELETE FROM whatsapp_desktop_limites; "
               f"DELETE FROM whatsapp_config WHERE organization_id='{ORG}'; DELETE FROM acoes_idempotentes WHERE chave LIKE 'k-pc-%'; DELETE FROM entrega_eventos WHERE order_id IN (SELECT id FROM orders WHERE client_name LIKE 'Cliente PC%'); "
               f"SET session_replication_role=replica; DELETE FROM orders WHERE client_name LIKE 'Cliente PC%'; DELETE FROM colaboradores WHERE user_id IN ('{E1}','{E2}'); SET session_replication_role=origin")], True)

print(f"\n{sum(R)}/{len(R)} PASS")
sys.exit(0 if all(R) else 1)
