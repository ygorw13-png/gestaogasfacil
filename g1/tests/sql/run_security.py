"""Testes de recusa e continuidade — banco PostgreSQL descartável em 127.0.0.1.
Uso: python3 run_security.py <URL> <rotulo>. Recusa executar fora de loopback."""
import subprocess, sys, json, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA":"a0000000-0000-4000-8000-00000000000a","userA":"a0000000-0000-4000-8000-00000000000b",
     "inativoA":"a0000000-0000-4000-8000-00000000000c","entregadorA":"a0000000-0000-4000-8000-00000000000d",
     "adminInativoA":"a0000000-0000-4000-8000-00000000000e","adminB":"b0000000-0000-4000-8000-00000000000a",
     "semPerfil":"c0000000-0000-4000-8000-00000000000a"}
ORG_A, ORG_B = "0a000000-0000-4000-8000-000000000000", "0b000000-0000-4000-8000-000000000000"
def run(user, sql):
    claims = json.dumps({"sub":U[user],"role":"authenticated"})
    script = f"BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n{sql};\nROLLBACK;"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:160]
def val(user, sql):
    ok, out, err = run(user, sql); return out if ok else "ERRO:" + err
def allowed(user, sql):
    ok, out, err = run(user, sql)
    # UPDATE/INSERT ... RETURNING 1 : vazio = bloqueado silenciosamente pela policy
    return ok and out != ""
R = []
def check(cat, name, cond, detail=""):
    R.append((cat, name, bool(cond))); print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name} {detail}")
ins = lambda org, uid: f"INSERT INTO orders(user_id,organization_id,client_name,tipo_venda,vasilhames_entregues,vasilhames_recebidos) VALUES ('{uid}','{org}','Teste','recarga',0,0) RETURNING 1"
mov = "SELECT registrar_movimentacao_portaria('ajuste','P13',1,0,0) AS mid \\gset\nSELECT organization_id FROM movimentacoes_portaria WHERE id = :'mid'"
# Continuidade
check("continuidade","userA lê pedidos da própria empresa", val("userA","SELECT count(*) FROM orders")=="2")
check("continuidade","userA grava pedido na própria empresa", allowed("userA", ins(ORG_A, U["userA"])))
check("continuidade","entregadorA lê pedidos da própria empresa (regra atual)", val("entregadorA","SELECT count(*) FROM orders")=="2")
check("continuidade","adminA lê colaboradores da própria empresa", val("adminA","SELECT count(*) FROM colaboradores")=="1")
check("continuidade","userA registra movimentação na própria empresa", val("userA", mov)==ORG_A)
check("continuidade","entregadorA atualiza a própria localização", allowed("entregadorA","UPDATE entregador_localizacoes SET latitude=-12.2 WHERE user_id=auth.uid() RETURNING 1"))
check("continuidade","adminA continua admin", val("adminA","SELECT has_role(auth.uid(),'admin')")=="t")
check("continuidade","pedidos do inativo continuam visíveis para a empresa (histórico preservado)", val("adminA","SELECT count(*) FROM orders WHERE client_name LIKE '%inativo%'")=="1")
# Permissões existentes mantidas
check("permissões","userA não lê colaboradores (só admin, regra atual)", val("userA","SELECT count(*) FROM colaboradores")=="0")
# Isolamento entre empresas
check("isolamento","userA não lê pedidos da empresa B", val("userA",f"SELECT count(*) FROM orders WHERE organization_id='{ORG_B}'")=="0")
check("isolamento","userA não grava pedido na empresa B", not allowed("userA", ins(ORG_B, U["userA"])))
check("isolamento","userA não lê dashboard_data 'system' da empresa B", val("userA","SELECT count(*) FROM dashboard_data")=="0")
check("isolamento","userA não altera dashboard_data 'system' da empresa B", not allowed("userA","UPDATE dashboard_data SET stock_data='{}' WHERE user_id='system' RETURNING 1"))
check("isolamento","entregadorA não move a localização para a empresa B", not allowed("entregadorA",f"UPDATE entregador_localizacoes SET organization_id='{ORG_B}' WHERE user_id=auth.uid() RETURNING 1"))
check("isolamento","usuário sem perfil não cria perfil já dentro da empresa B", not allowed("semPerfil",f"INSERT INTO profiles(id,name,role,organization_id) VALUES (auth.uid(),'X','user','{ORG_B}') RETURNING 1"))
check("isolamento","adminA não altera papel de usuário da empresa B", not run("adminA",f"SELECT set_user_role('{U['adminB']}','user')")[0])
check("isolamento","adminA não lê colaboradores da empresa B", val("adminA",f"SELECT count(*) FROM colaboradores WHERE organization_id='{ORG_B}'")=="0")
# Contas inativas
check("inativos","inativo não lê pedidos", val("inativoA","SELECT count(*) FROM orders")=="0")
check("inativos","inativo não grava pedido", not allowed("inativoA", ins(ORG_A, U["inativoA"])))
check("inativos","inativo não registra movimentação", not run("inativoA", mov)[0])
check("inativos","inativo não lê clientes", val("inativoA","SELECT count(*) FROM clients")=="0")
check("inativos","admin inativo perde papel admin", val("adminInativoA","SELECT has_role(auth.uid(),'admin')")=="f")
check("inativos","admin inativo não lê colaboradores", val("adminInativoA","SELECT count(*) FROM colaboradores")=="0")
check("inativos","admin inativo não altera papéis", not run("adminInativoA",f"SELECT set_user_role('{U['userA']}','admin')")[0])
# Sem fallback administrativo
check("sem fallback","usuário sem perfil não tem papel", val("semPerfil","SELECT coalesce(current_profile_role(),'nenhum')")=="nenhum")
check("sem fallback","usuário sem perfil não é admin", val("semPerfil","SELECT has_role(auth.uid(),'admin')")=="f")
check("sem fallback","usuário sem perfil não lê pedidos", val("semPerfil","SELECT count(*) FROM orders")=="0")
print(f"\n{LABEL}: {sum(r[2] for r in R)}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB","/tmp/g1db")+f"/result_{LABEL}.json","w"), ensure_ascii=False)
