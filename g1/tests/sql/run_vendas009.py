"""Valida 009 só em PostgreSQL descartável local, após reset_com009.sh.
Cada cenário é revertido. Os registros são fictícios.
"""
import json
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import psycopg
import sys
from pathlib import Path
from urllib.parse import urlparse

url = sys.argv[1]
assert urlparse(url).hostname == '127.0.0.1', 'Somente banco local descartável'
results = []
user = 'a0000000-0000-4000-8000-00000000000b'
org = '0a000000-0000-4000-8000-000000000000'
claims = json.dumps({'sub': user, 'role': 'authenticated'})
login = f"SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{claims}',true);"

def run(sql):
    try:
        with psycopg.connect(url, autocommit=True) as conn:
            cursor = conn.execute(f'BEGIN; {login}\n{sql}\nROLLBACK;')
            lines = []
            while True:
                if cursor.description:
                    lines.extend('|'.join(str(v) for v in row) for row in cursor.fetchall())
                if not cursor.nextset(): break
        return 0, lines[-1:] or [''], ''
    except psycopg.Error as exc:
        return 1, [''], str(exc)

def check(name, sql, expected=None, error=None):
    code, lines, stderr = run(sql)
    ok = (code != 0 and error in stderr) if error else (code == 0 and lines[-1] == expected)
    results.append({'teste': name, 'ok': ok})
    print(('PASS ' if ok else 'FAIL ') + name)
    if not ok: print(stderr or lines)

def opening(full=3, empty=2, product='P13', day='data_operacional()'):
    return f"SELECT registrar_movimentacao_portaria('abertura','{product}',{full},{empty},0,NULL,NULL,NULL,'Fixture 009',{day});"

def sale(q=1, kind='recarga', key='teste009-venda1', product='P13'):
    return f"SELECT venda_portaria(NULL,'Fixture009','{product}',{q},{q*125},'money','{kind}',true,NULL,'Teste 009','{key}');"

check('Sem abertura recusa venda', sale(), error='abertura da portaria')
check('Abertura ontem não libera hoje', opening(day='data_operacional()-1')+sale(), error='abertura da portaria')
check('Cheios insuficientes', opening(full=0)+sale(), error='Saldo insuficiente')
check('Produto não usa saldo de outro produto', opening()+sale(product='P20'), error='Saldo insuficiente')
check('Recarga exata zera cheios e recebe vazios', opening(full=2,empty=0)+sale(2)+
      f"SELECT sum(delta_cheios)||'/'||sum(delta_vazios) FROM movimentacoes_portaria WHERE organization_id='{org}' AND produto='P13' AND data_operacao=data_operacional();", expected='0/2')
check('Completa consome cheios', opening(full=1,empty=0)+sale(kind='completa')+
      f"SELECT sum(delta_cheios) FROM movimentacoes_portaria WHERE organization_id='{org}' AND produto='P13' AND data_operacao=data_operacional();", expected='0')
check('Vasilhame exige vazio, mesmo com cheio disponível', opening(full=5,empty=0)+sale(kind='vasilhame'), error='vazios')
check('Vasilhame exato consome vazio e preserva cheio', opening(full=4,empty=2)+sale(2,'vasilhame')+
      f"SELECT sum(delta_cheios)||'/'||sum(delta_vazios) FROM movimentacoes_portaria WHERE organization_id='{org}' AND produto='P13' AND data_operacao=data_operacional();", expected='4/0')
check('Reenvio não consome estoque novamente', opening(full=1)+sale()+sale()+
      "SELECT count(*) FROM orders WHERE client_name='Fixture009';", expected='1')
check('Segunda venda é recusada após esgotar', opening(full=1)+sale()+sale(key='teste009-venda2'), error='Saldo insuficiente')
# Captura a exceção numa subtransação; verifica o rollback de TODOS os efeitos.
attempt = sale().removeprefix('SELECT ').removesuffix(';')
check('Recusa não deixa pedido, recebimento ou chave',
      f"DO $t$ BEGIN BEGIN PERFORM {attempt}; RAISE EXCEPTION 'VENDA_NAO_RECUSADA'; EXCEPTION WHEN others THEN IF SQLERRM='VENDA_NAO_RECUSADA' THEN RAISE; END IF; END; END $t$;"
      "RESET ROLE; SELECT (SELECT count(*) FROM orders WHERE client_name='Fixture009')||'/'||"
      "(SELECT count(*) FROM acoes_idempotentes WHERE chave='teste009-venda1')||'/'||(SELECT count(*) FROM recebimentos);", expected='0/0/0')
check('Movimento avulso de venda também respeita saldo', opening(full=0)+
      "SELECT registrar_movimentacao_portaria('venda','P13',-1,1,0);", error='Saldo insuficiente')

# Duas transações reais disputam o mesmo último item, inclusive venda x transferência.
for transfer in (False, True):
    with psycopg.connect(url,autocommit=True) as conn:
        conn.execute(f"BEGIN; {login} {opening(full=1,empty=0)} COMMIT;")
    barrier = Barrier(2)
    def compete(index):
        try:
            with psycopg.connect(url,autocommit=True) as conn:
                conn.execute(f'BEGIN; {login}')
                barrier.wait(timeout=10)
                action = ("SELECT carga_saida('a0000000-0000-4000-8000-00000000000d','P13',1,'009-disputa-carga')"
                          if transfer and index == 1 else sale(key=f'009-disputa-{transfer}-{index}'))
                conn.execute(action)
                conn.execute('SELECT pg_sleep(0.1)')
                conn.execute('COMMIT')
            return 'ok'
        except psycopg.Error as exc:
            return str(exc)
    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(compete, (0,1)))
    with psycopg.connect(url,autocommit=True) as conn:
        balance = conn.execute(f"SELECT sum(delta_cheios) FROM movimentacoes_portaria WHERE organization_id='{org}' AND produto='P13' AND data_operacao=data_operacional()").fetchone()[0]
    ok = outcomes.count('ok') == 1 and any('Saldo insuficiente' in v for v in outcomes) and balance == 0
    name = 'Concorrência venda x carga' if transfer else 'Concorrência duas vendas'
    results.append({'teste':name,'ok':ok})
    print(('PASS ' if ok else 'FAIL ')+name)
    # Limpa só os registros FICTÍCIOS desta disputa para o cenário seguinte.
    with psycopg.connect(url,autocommit=True) as conn:
        conn.execute("TRUNCATE recebimentos,carga_movimentos,cargas,acoes_idempotentes,orders,movimentacoes_portaria CASCADE")

Path(__file__).with_name('resultado_vendas009.json').write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n')
print(f'{sum(r["ok"] for r in results)}/{len(results)}')
sys.exit(0 if all(r['ok'] for r in results) else 1)
