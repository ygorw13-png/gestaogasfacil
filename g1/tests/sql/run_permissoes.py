"""Testes por ação do 003 (permissões por papel, carga, venda a prazo).
Banco PostgreSQL descartável em 127.0.0.1 com fixtures fictícias. Uso: python3 run_permissoes.py <URL> <rotulo>"""
import subprocess, sys, json, threading
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA":"a0000000-0000-4000-8000-00000000000a","userA":"a0000000-0000-4000-8000-00000000000b",
     "inativoA":"a0000000-0000-4000-8000-00000000000c","entregadorA":"a0000000-0000-4000-8000-00000000000d",
     "entregador2A":"a0000000-0000-4000-8000-00000000000f","adminB":"b0000000-0000-4000-8000-00000000000a",
     "entregadorB":"b0000000-0000-4000-8000-00000000000d"}
ORG_A, ORG_B = "0a000000-0000-4000-8000-000000000000", "0b000000-0000-4000-8000-000000000000"
O1 = "0a000000-0000-4000-8000-0000000000a1"  # atribuído ao entregadorA, R$ 250, 2x P13
O2 = "0a000000-0000-4000-8000-0000000000a2"  # atribuído ao entregador2A
OB = "0b000000-0000-4000-8000-0000000000b1"
PN = "0a000000-0000-4000-8000-0000000000c1"  # promissória R$ 100

def psql(sql, user=None, commit=False):
    pre = ""
    if user:
        claims = json.dumps({"sub":U[user],"role":"authenticated"})
        pre = f"SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"
    script = f"BEGIN; {pre}{sql};\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:200]
def val(user, sql):
    ok, out, err = psql(sql, user); return out if ok else "ERRO:" + err
def ok(user, sql): return psql(sql, user)[0]
def rows(user, sql):
    """Gravação direta: aceita só se a política deixou passar (RETURNING devolve linha)."""
    r = psql(sql, user); return r[0] and r[1] != ""

FIX = f"""
SET session_replication_role = replica;
INSERT INTO auth.users(id,email) VALUES ('{U['entregador2A']}','entregador2.a@ficticio.test'),('{U['entregadorB']}','entregador.b@ficticio.test') ON CONFLICT DO NOTHING;
INSERT INTO profiles(id,name,role,organization_id,ativo) VALUES ('{U['entregador2A']}','Entregador Dois A','entregador','{ORG_A}',true),
 ('{U['entregadorB']}','Entregador B','entregador','{ORG_B}',true) ON CONFLICT DO NOTHING;
INSERT INTO user_roles(user_id,role) VALUES ('{U['entregador2A']}','entregador'),('{U['entregadorB']}','entregador');
INSERT INTO orders(id,user_id,organization_id,client_name,status,tipo_venda,product,price,quantity,vasilhames_entregues,vasilhames_recebidos,delivery_person,delivery_person_id) VALUES
 ('{O1}','{U['userA']}','{ORG_A}','Cliente Fictício 1','assigned','recarga','P13',250,2,0,0,'Entregador A','{U['entregadorA']}'),
 ('{O2}','{U['userA']}','{ORG_A}','Cliente Fictício 2','assigned','recarga','P13',125,1,0,0,'Entregador Dois A','{U['entregador2A']}'),
 ('{OB}','{U['adminB']}','{ORG_B}','Cliente B','assigned','recarga','P13',130,1,0,0,'Entregador B','{U['entregadorB']}');
INSERT INTO promissory_notes(id,organization_id,client_name,value,due_date,status) VALUES ('{PN}','{ORG_A}','Devedor Fictício',100,'2026-12-01','pending');
INSERT INTO colaboradores(nome,cargo,organization_id,situacao,data_admissao,cpf,telefone) VALUES ('Cobrador Inativo A','cobrador','{ORG_A}','inativo','2026-01-01','000.000.000-00','(00) 0000-0000');
SET session_replication_role = origin;
"""
assert psql(FIX, commit=True)[0], psql(FIX)[2]

R = []
def check(cat, name, cond):
    R.append((cat, name, bool(cond))); print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}")

saida = lambda q, k: f"SELECT carga_saida('{U['entregadorA']}','P13',{q},'{k}')"
# carga do entregadorA com 3 cheios, preparada pelo operador na mesma transação
def as_flow(steps):
    """Executa passos com usuários diferentes numa só transação (trocando o JWT)."""
    sql = ""
    for user, s in steps:
        claims = json.dumps({"sub":U[user],"role":"authenticated"})
        sql += f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n{s}" + ("\n" if "\\gset" in s else ";\n")
    r = psql(sql); return r if r[0] else (False, "", r[2])
CARGA = ("userA", saida(3, "k-saida-0001"))

# ── Admin
check("admin","admin corrige preço com motivo e histórico", as_flow([("adminA", f"SELECT admin_corrigir_pedido('{O1}',240,NULL,'Desconto combinado')"),
      ("adminA", f"SELECT (SELECT price FROM orders WHERE id='{O1}')||'/'||(SELECT count(*) FROM auditoria_correcoes WHERE registro_id='{O1}')")])[1]=="240.00/1")
check("admin","admin sem motivo é recusado", not ok("adminA", f"SELECT admin_corrigir_pedido('{O1}',240,NULL,'')"))
check("admin","admin não altera preço por gravação direta", not ok("adminA", f"UPDATE orders SET price=1 WHERE id='{O1}'"))
check("admin","admin não apaga pedido (sem exclusão definitiva)", not rows("adminA", f"DELETE FROM orders WHERE id='{O1}' RETURNING 1"))
check("admin","admin não apaga movimentação da portaria", not rows("adminA", "DELETE FROM movimentacoes_portaria RETURNING 1"))
check("admin","admin não apaga fechamento de caixa", not rows("adminA", "DELETE FROM fechamentos_caixa RETURNING 1"))
check("admin","admin altera configuração", rows("adminA", f"INSERT INTO configuracoes_entrega(organization_id,taxa_entrega) VALUES ('{ORG_A}',0) RETURNING 1"))
check("admin","admin lê colaboradores completos", val("adminA","SELECT count(*) FROM colaboradores")=="2")
check("admin","admin de B não corrige pedido de A", not ok("adminB", f"SELECT admin_corrigir_pedido('{O1}',1,NULL,'tentativa indevida')"))

# ── Operador (user)
check("operador","cria pedido", rows("userA", f"INSERT INTO orders(user_id,organization_id,client_name,tipo_venda,vasilhames_entregues,vasilhames_recebidos) VALUES (auth.uid(),'{ORG_A}','Novo','recarga',0,0) RETURNING 1"))
check("operador","opera pedido (observação/endereço)", rows("userA", f"UPDATE orders SET notes='portão azul' WHERE id='{O1}' RETURNING 1"))
check("operador","atribui entrega por ID", ok("userA", f"SELECT atribuir_entrega('{O1}','{U['entregador2A']}')"))
check("operador","não atribui a entregador de outra empresa", not ok("userA", f"SELECT atribuir_entrega('{O1}','{U['entregadorB']}')"))
check("operador","NÃO altera preço (pendente de autorização)", not ok("userA", f"UPDATE orders SET price=1 WHERE id='{O1}'"))
check("operador","NÃO cancela pedido (pendente)", not ok("userA", f"UPDATE orders SET status='cancelled' WHERE id='{O1}'"))
check("operador","NÃO usa correção administrativa", not ok("userA", f"SELECT admin_corrigir_pedido('{O1}',1,'cancelled','tentativa operador')"))
check("operador","NÃO reabre pedido concluído (estorno)", as_flow([("adminA", f"SELECT admin_corrigir_pedido('{O2}',NULL,'completed','teste fixture')"),
      ("userA", f"UPDATE orders SET status='pending' WHERE id='{O2}'")])[0] is False)
check("operador","abre/fecha caixa (cria fechamento)", rows("userA", f"INSERT INTO fechamentos_caixa(organization_id,data_fechamento,tipo,total_vendas,total_dinheiro,total_pix,total_cartao,total_outros,quantidades,estoque_final,divergencias,tem_divergencia,retroativo) VALUES ('{ORG_A}','2026-11-04','partial',0,0,0,0,0,'{{}}','{{}}','[]',false,false) RETURNING 1"))
check("operador","não altera fechamento já gravado", not rows("userA", "UPDATE fechamentos_caixa SET total_vendas=1 RETURNING 1"))
check("operador","registra despesa", rows("userA", f"INSERT INTO despesas(organization_id,tipo,descricao,valor,data,origem_dinheiro,registrado_por) VALUES ('{ORG_A}','geral','Fictícia',10,'2026-11-04','caixa_portaria',auth.uid()) RETURNING 1"))
check("operador","movimenta estoque da portaria", ok("userA", "SELECT registrar_movimentacao_portaria('ajuste','P13',1,0,0)"))
check("operador","não grava movimentação direto na tabela (só pela função)", not rows("userA", f"INSERT INTO movimentacoes_portaria(organization_id,tipo,produto,delta_cheios,delta_vazios,delta_emprestados,registrado_por,data_operacao) VALUES ('{ORG_A}','ajuste','P13',1,0,0,auth.uid(),'2026-11-04') RETURNING 1"))
check("operador","não usa tipo de carga sem a ação de carga", not ok("userA", "SELECT registrar_movimentacao_portaria('saida_carga','P13',-1,0,0)"))
check("operador","cadastra e consulta clientes", rows("userA", f"INSERT INTO clients(organization_id,name) VALUES ('{ORG_A}','Cliente Novo') RETURNING 1"))
check("operador","lê configuração de entrega", ok("userA","SELECT count(*) FROM configuracoes_entrega"))
check("operador","não altera configuração", not rows("userA", f"INSERT INTO configuracoes_entrega(organization_id,taxa_entrega) VALUES ('{ORG_A}',5) RETURNING 1"))
check("operador","não lê configuração de segurança", val("userA","SELECT count(*) FROM configuracoes_seguranca")=="0")
check("operador","lista de cobradores com id, nome, situação", val("userA","SELECT count(*)||'/'||string_agg(situacao,',' ORDER BY nome) FROM listar_cobradores()")=="2/ativo,inativo")
check("operador","lista de cobradores não expõe CPF/telefone", "cpf" not in val("userA","SELECT string_agg(column_name,',') FROM (SELECT * FROM listar_cobradores() LIMIT 0) x CROSS JOIN LATERAL (SELECT NULL::text column_name) y"))
check("operador","não lê o cadastro completo de colaboradores", val("userA","SELECT count(*) FROM colaboradores")=="0")
check("operador","não lê comissões nem frota", val("userA","SELECT (SELECT count(*) FROM comissao_regras)+(SELECT count(*) FROM vehicles)")=="0")
check("operador","não apaga cliente", not rows("userA","DELETE FROM clients RETURNING 1"))
check("operador","não altera recebimento de promissória por gravação direta", not ok("userA", f"UPDATE promissory_notes SET status='paid', paid_amount=100 WHERE id='{PN}'"))

# ── Venda a prazo
check("a prazo","recebimento parcial preserva saldo e histórico",
      as_flow([("userA", f"SELECT receber_promissoria('{PN}',40,'dinheiro','k-rec-0001')"),
               ("userA", f"SELECT status||'/'||paid_amount||'/'||(value-paid_amount)||'/'||(SELECT count(*) FROM recebimentos WHERE promissory_id='{PN}') FROM promissory_notes WHERE id='{PN}'")])[1]=="parcial/40.00/60.00/1")
check("a prazo","segundo recebimento quita (dois registros)",
      as_flow([("userA", f"SELECT receber_promissoria('{PN}',40,'dinheiro','k-rec-0001')"), ("userA", f"SELECT receber_promissoria('{PN}',60,'pix','k-rec-0002')"),
               ("userA", f"SELECT status||'/'||(SELECT count(*) FROM recebimentos WHERE promissory_id='{PN}') FROM promissory_notes WHERE id='{PN}'")])[1]=="paid/2")
check("a prazo","recebimento acima do saldo é recusado", not ok("userA", f"SELECT receber_promissoria('{PN}',101,'dinheiro','k-rec-0003')"))
check("a prazo","reenvio do mesmo recebimento não cobra duas vezes",
      as_flow([("userA", f"SELECT receber_promissoria('{PN}',40,'dinheiro','k-rec-0004')"), ("userA", f"SELECT receber_promissoria('{PN}',40,'dinheiro','k-rec-0004')"),
               ("userA", f"SELECT paid_amount FROM promissory_notes WHERE id='{PN}'")])[1]=="40.00")
check("a prazo","venda a prazo na rua não gera recebimento (não entra no caixa)",
      as_flow([CARGA, ("entregadorA", "SELECT entregador_venda_rua(NULL,'Fiado Fictício',NULL,'P13',1,125,'promissoria','recarga',0,1,NULL,'k-rua-0001') AS v \\gset"),
               ("userA", "SELECT (SELECT count(*) FROM recebimentos WHERE order_id=:'v')||'/'||(SELECT value FROM promissory_notes WHERE order_id=:'v')||'/'||(SELECT created_at::date = now()::date FROM orders WHERE id=:'v')")])[1]=="0/125.00/t")

# ── Entregador
check("entregador","vê só as entregas atribuídas a ele", val("entregadorA","SELECT count(*)||'/'||string_agg(id::text,',') FROM orders")==f"1/{O1}")
check("entregador","não edita pedido diretamente", not rows("entregadorA", f"UPDATE orders SET notes='x' WHERE id='{O1}' RETURNING 1"))
check("entregador","não cria pedido diretamente", not rows("entregadorA", f"INSERT INTO orders(user_id,organization_id,client_name,tipo_venda,vasilhames_entregues,vasilhames_recebidos) VALUES (auth.uid(),'{ORG_A}','X','recarga',0,0) RETURNING 1"))
check("entregador","aceita entrega própria", ok("entregadorA", f"SELECT entregador_aceitar_entrega('{O1}')"))
check("entregador","não aceita entrega de outro entregador", not ok("entregadorA", f"SELECT entregador_aceitar_entrega('{O2}')"))
check("entregador","não aceita entrega de outra empresa", not ok("entregadorA", f"SELECT entregador_aceitar_entrega('{OB}')"))
check("entregador","não conclui sem ter aceitado (transição)", not as_flow([CARGA, ("entregadorA", f"SELECT entregador_concluir_entrega('{O1}','dinheiro',0,'k-conc-0001')")])[0])
check("entregador","não conclui sem carga suficiente", not as_flow([("userA", saida(1,"k-saida-0002")), ("entregadorA", f"SELECT entregador_aceitar_entrega('{O1}')"),
      ("entregadorA", f"SELECT entregador_concluir_entrega('{O1}','dinheiro',0,'k-conc-0002')")])[0])
check("entregador","conclui: consome carga uma vez, registra recebimento próprio",
      as_flow([CARGA, ("entregadorA", f"SELECT entregador_aceitar_entrega('{O1}')"), ("entregadorA", f"SELECT entregador_concluir_entrega('{O1}','dinheiro',2,'k-conc-0003')"),
               ("entregadorA", f"SELECT entregador_concluir_entrega('{O1}','dinheiro',2,'k-conc-0003')"),
               ("entregadorA", f"SELECT (SELECT status FROM orders WHERE id='{O1}')||'/'||(SELECT sum(delta_cheios) FROM carga_movimentos)||'/'||(SELECT sum(delta_vazios) FROM carga_movimentos)||'/'||(SELECT count(*)||':'||sum(valor) FROM recebimentos WHERE recebido_por=auth.uid())")])[1]=="completed/1/2/1:250.00")
check("entregador","conclusão não baixa a portaria de novo (só a saída para a carga)",
      as_flow([CARGA, ("entregadorA", f"SELECT entregador_aceitar_entrega('{O1}')"), ("entregadorA", f"SELECT entregador_concluir_entrega('{O1}','pix',0,'k-conc-0004')"),
               ("userA", "SELECT coalesce(sum(delta_cheios),0) FROM movimentacoes_portaria WHERE tipo='saida_carga' OR referencia_id IS NOT NULL")])[1]=="-3")
check("entregador","recusa com motivo volta para a fila sem vínculo",
      as_flow([("entregadorA", f"SELECT entregador_recusar_entrega('{O1}','pneu furado')"), ("userA", f"SELECT status||'/'||coalesce(delivery_person_id::text,'nenhum') FROM orders WHERE id='{O1}'")])[1]=="pending/nenhum")
check("entregador","venda na rua própria consome a carga",
      as_flow([CARGA, ("entregadorA", "SELECT entregador_venda_rua(NULL,'Rua Fictícia',NULL,'P13',2,250,'pix','recarga',0,2,NULL,'k-rua-0002')"),
               ("entregadorA", "SELECT (SELECT sum(delta_cheios) FROM carga_movimentos)||'/'||(SELECT count(*) FROM orders WHERE origem_venda='rua')")])[1]=="1/1")
check("entregador","venda na rua reenviada não duplica",
      as_flow([CARGA, ("entregadorA", "SELECT entregador_venda_rua(NULL,'Rua',NULL,'P13',1,125,'dinheiro','recarga',0,1,NULL,'k-rua-0003')"),
               ("entregadorA", "SELECT entregador_venda_rua(NULL,'Rua',NULL,'P13',1,125,'dinheiro','recarga',0,1,NULL,'k-rua-0003')"),
               ("entregadorA", "SELECT (SELECT count(*) FROM orders WHERE origem_venda='rua')||'/'||(SELECT sum(delta_cheios) FROM carga_movimentos)")])[1]=="1/2")
check("entregador","venda na rua acima da carga é recusada", not as_flow([CARGA, ("entregadorA", "SELECT entregador_venda_rua(NULL,'Rua',NULL,'P13',4,500,'dinheiro','recarga',0,0,NULL,'k-rua-0004')")])[0])
check("entregador","sem carga não vende na rua", not ok("entregador2A", "SELECT entregador_venda_rua(NULL,'Rua',NULL,'P13',1,125,'dinheiro','recarga',0,0,NULL,'k-rua-0005')"))
check("entregador","devolve sobra da própria carga para a portaria",
      as_flow([CARGA, ("entregadorA", "SELECT id FROM cargas WHERE status='aberta' \\gset c_"), ("entregadorA", "SELECT carga_devolver(:'c_id','P13',2,0,'k-dev-0001')"),
               ("userA", "SELECT (SELECT sum(delta_cheios) FROM carga_movimentos)||'/'||(SELECT sum(delta_cheios) FROM movimentacoes_portaria WHERE referencia_id=:'c_id')")])[1]=="1/-1")
check("entregador","não devolve mais do que tem", not as_flow([CARGA, ("entregadorA", "SELECT id FROM cargas WHERE status='aberta' \\gset c_"), ("entregadorA", "SELECT carga_devolver(:'c_id','P13',4,0,'k-dev-0002')")])[0])
check("entregador","não mexe na carga de outro entregador", not as_flow([CARGA, ("entregadorA", "SELECT id FROM cargas WHERE status='aberta' \\gset c_"), ("entregador2A", "SELECT carga_devolver(:'c_id','P13',1,0,'k-dev-0003')")])[0])
check("entregador","não cria carga (saída é do operador)", not ok("entregadorA", saida(5, "k-saida-0009")))
check("entregador","não movimenta estoque da portaria", not ok("entregadorA", "SELECT registrar_movimentacao_portaria('ajuste','P13',10,0,0)"))
check("entregador","não lê financeiro (despesas, fechamentos, promissórias)", val("entregadorA","SELECT (SELECT count(*) FROM despesas)+(SELECT count(*) FROM fechamentos_caixa)+(SELECT count(*) FROM promissory_notes)")=="0")
check("entregador","não recebe promissória", not ok("entregadorA", f"SELECT receber_promissoria('{PN}',10,'dinheiro','k-rec-0009')"))
check("entregador","cadastro rápido e consulta de clientes", rows("entregadorA", f"INSERT INTO clients(organization_id,name) VALUES ('{ORG_A}','Rápido') RETURNING 1") and val("entregadorA","SELECT count(*)>=0 FROM clients")=="t")
check("entregador","não altera cliente", not rows("entregadorA","UPDATE clients SET name='x' RETURNING 1"))
check("entregador","lê configuração de entrega, não a financeira", ok("entregadorA","SELECT count(*) FROM configuracoes_entrega") and val("entregadorA","SELECT count(*) FROM configuracoes_financeiras")=="0")
check("entregador","não lista cobradores", not ok("entregadorA","SELECT * FROM listar_cobradores()"))

# ── Contas inativas e chamadas internas
check("inativos","inativo não executa nenhuma ação controlada", not ok("inativoA", f"SELECT receber_promissoria('{PN}',10,'dinheiro','k-rec-0010')") and not ok("inativoA", "SELECT * FROM listar_cobradores()"))
check("internas","funções internas não são chamáveis diretamente", not ok("userA", f"SELECT _consumir_carga('{ORG_A}','{U['entregadorA']}','P13',1,0,0,'consumo_entrega',NULL)"))
check("internas","tabela de reenvio não é legível", val("userA","SELECT count(*) FROM acoes_idempotentes")=="0")

# ── Concorrência real (duas conexões simultâneas, gravação efetiva no banco descartável)
assert psql(saida(3, "k-conc-saida"), "userA", commit=True)[0]
res = []
def venda(k):
    res.append(psql(f"SELECT entregador_venda_rua(NULL,'Concorrente',NULL,'P13',2,250,'dinheiro','recarga',0,0,NULL,'{k}')", "entregadorA", commit=True)[0])
t = [threading.Thread(target=venda, args=(f"k-par-000{i}",)) for i in range(2)]
[x.start() for x in t]; [x.join() for x in t]
check("concorrência","duas vendas simultâneas de 2 com carga de 3: só uma passa", sorted(res)==[False, True] and val("adminA","SELECT sum(delta_cheios) FROM carga_movimentos")=="1")
res.clear()
t = [threading.Thread(target=venda, args=("k-mesma-chave",)) for _ in range(2)]
assert psql(saida(4, "k-conc-saida2"), "userA", commit=True)[0]
[x.start() for x in t]; [x.join() for x in t]
check("concorrência","mesma chave enviada duas vezes ao mesmo tempo: uma venda", val("adminA","SELECT count(*) FROM orders WHERE client_name='Concorrente'")=="2" and val("adminA","SELECT sum(delta_cheios) FROM carga_movimentos")=="3")

print(f"\n{LABEL}: {sum(r[2] for r in R)}/{len(R)}")
json.dump(R, open(f"/tmp/g1db/perm_{LABEL}.json","w"), ensure_ascii=False)
