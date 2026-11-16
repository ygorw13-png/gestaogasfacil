"""Testes do 016 (canal do aviso + fila de WhatsApp). Banco DESCARTÁVEL em 127.0.0.1, só dados fictícios.
Rode depois de reset_com016.sh com_abertura. Uso: python3 run_aviso016.py <URL>"""
import subprocess, sys, json
URL = sys.argv[1]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d", "adminB": "b0000000-0000-4000-8000-00000000000a"}
E1, E2 = U["entregadorA"], "a0000000-0000-4000-8000-0000000000f2"
ORG = "0a000000-0000-4000-8000-000000000000"


def as_user(u):
    if u == "root": return "RESET ROLE;\n"
    if u == "service": return "RESET ROLE; SET LOCAL ROLE service_role;\n"
    c = json.dumps({"sub": U[u], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{c}', true) \\g /dev/null\n"


def flow(steps):
    script = "SET TimeZone='UTC';\nBEGIN;\n" + "".join(as_user(u) + s + ";\n" for u, s in steps) + "ROLLBACK;"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:400]


out = lambda s: (lambda r: r[1] if r[0] else "ERRO:" + r[2])(flow(s))
R = []


def check(name, cond, info=None):
    R.append(bool(cond)); print(f"{'PASS' if cond else 'FAIL'} {name}" + ("" if cond else f"  -> {info}"))


SETUP = [("root", f"INSERT INTO colaboradores(nome,cargo,telefone,data_admissao,situacao,organization_id,user_id) VALUES "
                  f"('Entregador A','entregador','(75) 99999-0001',current_date,'ativo','{ORG}','{E1}'),"
                  f"('Entregador Dois A','entregador','75 98888-0002',current_date,'ativo','{ORG}','{E2}')"),
         ("userA", f"INSERT INTO orders(user_id,organization_id,client_name,address,product,quantity,price,payment_method,tipo_venda,origem_venda) "
                   f"VALUES ('{U['userA']}','{ORG}','Cliente Aviso','{{\"street\":\"Rua Ficticia\",\"number\":\"10\"}}','GLP P13',2,240,'promissoria','recarga','pedido')")]
ORD = "(SELECT id FROM orders WHERE client_name='Cliente Aviso')"
ATR = lambda e=E1, canal="'app_whatsapp'", k="k-aviso-016-a", who="userA": (who, f"SELECT atribuir_entrega_aviso({ORD},'{e}',false,'{k}',{canal})")
REA = lambda e=E2, canal="'app_whatsapp'", k="k-aviso-016-r": ("userA", f"SELECT reatribuir_entrega_aviso({ORD},'{e}','Saiu de rota',false,'{k}',{canal})")
ESTADO = ("root", f"SELECT status||'|'||coalesce(canal_aviso,'-')||'|'||(SELECT count(*) FROM whatsapp_envios WHERE order_id=o.id)"
                  f"||'|'||coalesce((SELECT string_agg(status||':'||telefone, ',' ORDER BY telefone DESC) FROM whatsapp_envios WHERE order_id=o.id),'-') FROM orders o WHERE id={ORD}")

check("App + WhatsApp: atribui e cria 1 envio aguardando com telefone normalizado",
      out(SETUP + [ATR(), ESTADO]) == "assigned|app_whatsapp|1|aguardando:5575999990001", out(SETUP + [ATR(), ESTADO]))
r = out(SETUP + [ATR(canal="'whatsapp'")])
check("Só WhatsApp recusado com motivo (depende de receber respostas)", "ainda não está disponível" in r, r)
check("Só WhatsApp recusado: pedido continua na fila, sem envio",
      out(SETUP + [("root", "SAVEPOINT s"), ATR(canal="'whatsapp'")])[:4] == "ERRO" and
      out(SETUP + [("root", f"DO $$ BEGIN PERFORM atribuir_entrega_aviso({ORD},'{E1}',false,'k-x-016-1','whatsapp'); EXCEPTION WHEN others THEN NULL; END $$"), ESTADO]) == "pending|-|0|-")
r = out(SETUP + [ATR(canal="NULL")])
check("Canal vazio recusado", "Escolha o canal" in r, r)
r = out(SETUP + [("root", f"UPDATE colaboradores SET telefone='123' WHERE user_id='{E1}'"), ATR()])
check("Telefone inválido recusado", "Telefone do entregador inválido" in r, r)
check("Telefone inválido: nada gravado", out(SETUP + [("root", f"UPDATE colaboradores SET telefone='123' WHERE user_id='{E1}'"),
      ("root", f"DO $$ BEGIN PERFORM atribuir_entrega_aviso({ORD},'{E1}',false,'k-x-016-2','app_whatsapp'); EXCEPTION WHEN others THEN NULL; END $$"), ESTADO]) == "pending|-|0|-")
r = out(SETUP + [("root", f"UPDATE colaboradores SET user_id=NULL WHERE user_id='{E1}'"), ATR()])
check("Sem vínculo com a conta do app recusado (não associa por nome)", "sem cadastro de colaborador vinculado" in r, r)
check("Toque duplo (mesma chave): 1 atribuição, 1 envio",
      out(SETUP + [ATR(), ATR(), ("root", f"SELECT (SELECT count(*) FROM whatsapp_envios WHERE order_id={ORD})||'|'||(SELECT count(*) FROM entrega_eventos WHERE order_id={ORD} AND tipo='atribuicao')")]) == "1|1")
check("Reatribuição: envio pendente do anterior cancelado, novo aguardando",
      out(SETUP + [ATR(), REA(), ESTADO]) == "assigned|app_whatsapp|2|cancelado:5575999990001,aguardando:5575988880002", out(SETUP + [ATR(), REA(), ESTADO]))
check("Reatribuição: mensagem já enviada ao anterior não é desfeita",
      out(SETUP + [ATR(), ("root", f"UPDATE whatsapp_envios SET status='enviado' WHERE entregador_id='{E1}'"), REA(), ESTADO])
      == "assigned|app_whatsapp|2|enviado:5575999990001,aguardando:5575988880002")
check("Reatribuição com toque duplo: 1 envio novo",
      out(SETUP + [ATR(), REA(), REA(), ("root", f"SELECT count(*) FROM whatsapp_envios WHERE order_id={ORD} AND entregador_id='{E2}'")]) == "1")
ENV = lambda e=E1: f"(SELECT id FROM whatsapp_envios WHERE order_id={ORD} AND entregador_id='{e}')"
RES = lambda conf="false", e=E1: ("service", f"SELECT whatsapp_envio_reservar({ENV(e)},{conf})->>'ok'")
check("Servidor reserva o envio uma vez só (sem envio duplicado)", out(SETUP + [ATR(), RES(), RES()]) == "false")
check("Envio antigo não sai após reatribuição",
      out(SETUP + [ATR(), ("root", f"SET session_replication_role=replica; UPDATE orders SET delivery_person_id='{E2}' WHERE id={ORD}; SET session_replication_role=origin"),
                   RES(), ("root", f"SELECT status FROM whatsapp_envios WHERE id={ENV()}")]) == "cancelado")
FIM = lambda st: ("service", f"SELECT whatsapp_envio_resultado({ENV()},'{st}',NULL,'x')")
check("Falha permite tentar de novo no mesmo envio", out(SETUP + [ATR(), RES(), FIM("falha"), RES(), ("root", f"SELECT status||tentativas FROM whatsapp_envios WHERE id={ENV()}")]) == "enviando2")
check("Incerto não reenvia sem confirmação", out(SETUP + [ATR(), RES(), FIM("incerto"), RES()]) == "false")
check("Incerto reenvia só com confirmação", out(SETUP + [ATR(), RES(), FIM("incerto"), RES("true")]) == "true")
check("Enviado não é reenviado", out(SETUP + [ATR(), RES(), FIM("enviado"), RES("true")]) == "false")
r = out(SETUP + [ATR(who="entregadorA")]); check("Entregador não atribui", "Sem permissão" in r, r)
r = out(SETUP + [ATR(who="adminB")]); check("Outra empresa recusada", r.startswith("ERRO"), r)
r = out(SETUP + [("userA", f"INSERT INTO whatsapp_envios(organization_id,order_id,entregador_id,telefone,canal,chave) VALUES ('{ORG}',{ORD},'{E1}','5575999990001','app_whatsapp','k-x-016-3')")])
check("Operador não grava envio direto", "permission denied" in r or "row-level" in r, r)
r = out(SETUP + [ATR(), ("userA", f"SELECT whatsapp_envio_reservar({ENV()},false)")])
check("Operador não reserva/dispara envio pelo banco", "permission denied" in r, r)
r = out(SETUP + [("adminA", f"UPDATE colaboradores SET user_id=NULL WHERE user_id='{E1}' RETURNING 'ok'")])
check("Administrador altera o vínculo", r == "ok", r)
r = out(SETUP + [("root", "SELECT 1"), ("userA", f"SELECT count(*) FROM whatsapp_envios")])
check("Operador lê a fila da empresa", not r.startswith("ERRO"), r)
r = out(SETUP + [("userA", "SELECT string_agg(nome||':'||vinculado||':'||telefone_valido||':'||coalesce(telefone_final,'-'), ',' ORDER BY nome) FROM listar_entregadores_aviso()")])
check("Lista para atribuição mostra vínculo e telefone mascarado", r == "Entregador A:true:true:0001,Entregador Dois A:true:true:0002", r)
r = out(SETUP + [("entregadorA", "SELECT count(*) FROM listar_entregadores_aviso()")]); check("Entregador não lista", "Sem permissão" in r, r)
print(f"aviso016: {sum(R)}/{len(R)}")
sys.exit(0 if all(R) else 1)
