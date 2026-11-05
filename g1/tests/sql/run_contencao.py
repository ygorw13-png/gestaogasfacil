"""Contenção do 003: o app atual do entregador volta a funcionar e os bloqueios continuam.
Banco descartável 127.0.0.1. Uso: python3 run_contencao.py <URL>"""
import sys
sys.argv = [sys.argv[0], sys.argv[1], "contencao"]
_full = open(__file__.replace("run_contencao.py", "run_permissoes.py")).read()
exec(_full.split("R = []")[0])
exec(_full.split("R = []")[1].split("# ── Admin")[0])
R = []
def check(name, cond):
    R.append(bool(cond)); print(f"{'PASS' if cond else 'FAIL'} {name}")
# Fluxo do app publicado (gravação direta)
check("entregador aceita como o app atual (UPDATE status=delivering)", rows("entregadorA", f"UPDATE orders SET status='delivering', accepted_at=now() WHERE id='{O1}' RETURNING 1"))
check("entregador conclui como o app atual", as_flow([("entregadorA", f"UPDATE orders SET status='delivering' WHERE id='{O1}'"),
      ("entregadorA", f"UPDATE orders SET status='completed', delivered_at=now() WHERE id='{O1}' RETURNING 1")])[1]=="1")
check("entregador insere venda na rua como o app atual", rows("entregadorA", f"INSERT INTO orders(user_id,organization_id,client_name,tipo_venda,vasilhames_entregues,vasilhames_recebidos,origem_venda,status) VALUES (auth.uid(),'{ORG_A}','Rua','recarga',0,0,'rua','completed') RETURNING 1"))
check("entregador cria promissória da venda na rua", rows("entregadorA", f"INSERT INTO promissory_notes(organization_id,client_name,value,due_date,status,created_by) VALUES ('{ORG_A}','Rua',10,'2026-12-01','pending',auth.uid()) RETURNING 1"))
# Bloqueios preservados
check("entregador NÃO altera preço", not ok("entregadorA", f"UPDATE orders SET price=1 WHERE id='{O1}'"))
check("entregador NÃO cancela", not ok("entregadorA", f"UPDATE orders SET status='cancelled' WHERE id='{O1}'"))
check("entregador NÃO reabre pedido concluído", not as_flow([("adminA", f"SELECT admin_corrigir_pedido('{O2}',NULL,'completed','fixture teste')"), ("entregadorA", f"UPDATE orders SET status='pending' WHERE id='{O2}'")])[0])
check("entregador NÃO apaga pedido", not rows("entregadorA", f"DELETE FROM orders RETURNING 1"))
check("entregador NÃO lê pedidos da empresa B", val("entregadorA", f"SELECT count(*) FROM orders WHERE organization_id='{ORG_B}'")=="0")
check("entregador NÃO insere pedido em nome de outro", not rows("entregadorA", f"INSERT INTO orders(user_id,organization_id,client_name,tipo_venda,vasilhames_entregues,vasilhames_recebidos,origem_venda) VALUES ('{U['userA']}','{ORG_A}','X','recarga',0,0,'rua') RETURNING 1"))
check("entregador NÃO movimenta portaria", not ok("entregadorA", "SELECT registrar_movimentacao_portaria('ajuste','P13',5,0,0)"))
check("entregador NÃO lê financeiro", val("entregadorA", "SELECT (SELECT count(*) FROM despesas)+(SELECT count(*) FROM fechamentos_caixa)")=="0")
check("entregador NÃO quita promissória", not ok("entregadorA", f"UPDATE promissory_notes SET status='paid' WHERE id='{PN}'"))
check("inativo continua bloqueado", val("inativoA", "SELECT count(*) FROM orders")=="0")
check("operador continua sem alterar preço", not ok("userA", f"UPDATE orders SET price=1 WHERE id='{O1}'"))
check("operador continua sem cadastro completo de colaboradores", val("userA", "SELECT count(*) FROM colaboradores")=="0")
print(f"\ncontencao: {sum(R)}/{len(R)}")
