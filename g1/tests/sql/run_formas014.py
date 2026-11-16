"""Testes do 014 (forma de pagamento com identidade própria; valor opcional para vale-gás, Gás do Povo e convênio).
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, só dados fictícios. Rode depois de reset_com014.sh com_abertura.
Uso: python3 run_formas014.py <URL> <rotulo>"""
import subprocess, sys, json
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "entregadorA": "a0000000-0000-4000-8000-00000000000d"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
E1 = U["entregadorA"]


def psql(sql, commit=False):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:500]


def as_user(user):
    if user == "root":
        return "RESET ROLE;\n"
    claims = json.dumps({"sub": U[user], "role": "authenticated"})
    return f"RESET ROLE; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', '{claims}', true) \\g /dev/null\n"


def flow(steps):
    return psql("".join(as_user(u) + s + ";\n" for u, s in steps))


def out(steps):
    r = flow(steps)
    return r[1] if r[0] else "ERRO:" + r[2]


def err(steps):
    r = flow(steps)
    return "" if r[0] else r[2]


R = []


def check(cat, name, cond, info=None):
    R.append((cat, name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}" + ("" if cond or info is None else f"  -> {info}"))


Q = lambda sql: ("root", sql)
ORD = lambda cli: f"(SELECT id FROM orders WHERE client_name='{cli}' ORDER BY created_at DESC, id LIMIT 1)"
VP = lambda cli, forma, valor, k: ("userA", f"SELECT venda_portaria(NULL,'{cli}','P13',1,{valor},'{forma}','recarga',NULL,NULL,'t014','{k}',NULL,false)")
LINHA = lambda cli: Q(f"SELECT payment_method||'|'||coalesce(price::text,'NULL')||'|'||(SELECT count(*) FROM recebimentos WHERE order_id={ORD(cli)})||'|'||(SELECT count(*) FROM promissory_notes WHERE order_id={ORD(cli)}) FROM orders WHERE id={ORD(cli)}")
SAIDA = lambda q, k: ("userA", f"SELECT carga_saida('{E1}','P13',{q},'{k}')")
RUA = lambda cli, forma, valor, k: ("entregadorA", f"SELECT entregador_venda_rua(NULL,'{cli}',NULL,'P13',1,{valor},'{forma}','recarga',0,1,'t','{k}')")

OBRIG = {"promissoria": "promissoria", "pix": "pix", "money": "money", "credit": "credit", "debit": "debit"}
OPC = {"vale-gas": "vale-gas", "gas-povo": "gas-povo", "convenio": "convenio"}

for f in OBRIG:
    check("obrigatoria", f"{f}: valor vazio recusado", "maior que zero" in err([VP(f"O {f} nulo", f, "NULL", f"k-{f}-n-014k")]))
    check("obrigatoria", f"{f}: valor zero recusado", "maior que zero" in err([VP(f"O {f} zero", f, "0", f"k-{f}-z-014k")]))
esperado_obrig = {"promissoria": "promissoria|108.00|0|1", "pix": "pix|108.00|1|0", "money": "money|108.00|1|0",
                  "credit": "credit|108.00|1|0", "debit": "debit|108.00|1|0"}
for f, exp in esperado_obrig.items():
    r = out([VP(f"O {f}", f, "108", f"k-{f}-ok-014k"), LINHA(f"O {f}")])
    check("obrigatoria", f"{f}: valor válido aceito e gravado com a própria forma", r == exp, r)

for f in OPC:
    r = out([VP(f"P {f} sem", f, "NULL", f"k-{f}-sem-014k"), LINHA(f"P {f} sem")])
    check("opcional", f"{f}: sem valor aceito, preço 'não informado', sem recebimento nem promissória", r == f"{f}|NULL|0|0", r)
    r = out([VP(f"P {f} com", f, "95.5", f"k-{f}-com-014k"), LINHA(f"P {f} com")])
    check("opcional", f"{f}: valor informado gravado, sem recebimento nem promissória", r == f"{f}|95.50|0|0", r)
    check("opcional", f"{f}: valor zero explícito recusado (vazio ou > 0)", "maior que zero ou deixe em branco" in err([VP(f"P {f} z", f, "0", f"k-{f}-z-014k")]))

r = out([VP("G Povo", "gasPovo", "NULL", "k-gp1-014k"), LINHA("G Povo")])
check("identidade", "grafia 'gasPovo' grava Gás do Povo, não convênio", r == "gas-povo|NULL|0|0", r)
r = out([VP("G Povo 2", "Gas do Povo", "NULL", "k-gp2-014k"), LINHA("G Povo 2")])
check("identidade", "grafia 'Gas do Povo' grava gas-povo (acentos: conferidos no banco UTF-8)", r == "gas-povo|NULL|0|0", r)
r = out([VP("G Cred", "Cartao de Credito", "50", "k-gc-014k"), VP("G Deb", "Cartao de Debito", "50", "k-gd-014k"),
         Q(f"SELECT (SELECT payment_method FROM orders WHERE id={ORD('G Cred')})||','||(SELECT payment_method FROM orders WHERE id={ORD('G Deb')})")])
check("identidade", "crédito e débito ficam separados no registro da venda", r == "credit,debit", r)
check("identidade", "forma inválida gera erro claro e não grava", "Forma de pagamento inválida: boleto" in err([VP("G Inv", "boleto", "50", "k-inv-014k")]))
check("identidade", "forma ambígua 'cartao' gera erro (não vira crédito nem débito)", "Forma de pagamento inválida" in err([VP("G Amb", "cartao", "50", "k-amb-014k")]))
check("identidade", "forma vazia gera erro", "Forma de pagamento inválida" in err([VP("G Vaz", "", "50", "k-vaz-014k")]))

# Reenvio (mesma chave, mesmo conteúdo): um pedido só, mesma forma.
r = out([VP("R Povo", "gas-povo", "NULL", "k-re-014k"), VP("R Povo", "gas-povo", "NULL", "k-re-014k"),
         Q("SELECT count(*)||'|'||min(payment_method) FROM orders WHERE client_name='R Povo'")])
check("reenvio", "reenvio da mesma venda Gás do Povo não duplica nem troca a forma", r == "1|gas-povo", r)
check("reenvio", "mesma chave com outra forma é recusada (não vira outra venda)",
      err([VP("R Troca", "gas-povo", "NULL", "k-re2-014k"), VP("R Troca", "convenio", "NULL", "k-re2-014k")]) != "")

# Venda na rua (fila offline do entregador)
r = out([SAIDA(5, "k-sai-014-014k"), RUA("Rua Povo", "gas-povo", "NULL", "k-rua1-014k"), RUA("Rua Povo", "gas-povo", "NULL", "k-rua1-014k"),
         Q("SELECT count(*)||'|'||min(payment_method)||'|'||coalesce(min(price)::text,'NULL') FROM orders WHERE client_name='Rua Povo'")])
check("rua", "venda na rua Gás do Povo sem valor, reenviada: uma venda, forma preservada", r == "1|gas-povo|NULL", r)
check("rua", "venda na rua PIX sem valor recusada", "maior que zero" in err([SAIDA(5, "k-sai-014b-014k"), RUA("Rua Pix", "pix", "NULL", "k-rua2-014k")]))
r = out([SAIDA(5, "k-sai-014c-014k"), RUA("Rua Deb", "debit", "40", "k-rua3-014k"), LINHA("Rua Deb")])
check("rua", "venda na rua débito grava 'debit' com recebimento", r == "debit|40.00|1|0", r)

# Conclusão de entrega pela portaria com forma opcional
PED = lambda cli: ("userA", f"INSERT INTO orders(user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda,origem_venda) VALUES ('{U['userA']}','{ORG_A}','{cli}','P13',1,110,'gasPovo','recarga','pedido')")
ATR = lambda cli, k: ("userA", f"SELECT atribuir_entrega({ORD(cli)},'{E1}',true,'{k}')")
CON = lambda cli, forma, valor, k: ("userA", f"SELECT operador_concluir_entrega({ORD(cli)},'{forma}',{valor},1,NULL,'{k}')")
r = out([PED("E Povo"), ATR("E Povo", "k-atr1-014k"), CON("E Povo", "gasPovo", "NULL", "k-con1-014k"), LINHA("E Povo")])
check("entrega", "conclusão com Gás do Povo sem valor: grava gas-povo, sem recebimento/promissória", r == "gas-povo|110.00|0|0", r)
r = out([PED("E Conv"), ATR("E Conv", "k-atr2-014k"), CON("E Conv", "convenio", "NULL", "k-con2-014k"), LINHA("E Conv")])
check("entrega", "conclusão com convênio não cria promissória", r == "convenio|110.00|0|0", r)
check("entrega", "conclusão com dinheiro sem valor continua recusada",
      "Informe o valor" in err([PED("E Din"), ATR("E Din", "k-atr3-014k"), CON("E Din", "money", "NULL", "k-con3-014k")]))

ok = sum(1 for r in R if r[2])
print(f"\n{LABEL}: {ok}/{len(R)}")
json.dump([{"cat": c, "nome": n, "ok": o} for c, n, o in R], open(__import__("os").path.join(__import__("os").path.dirname(__file__) or ".", f"result_formas014_{LABEL}.json"), "w"), ensure_ascii=False, indent=1)
sys.exit(0 if ok == len(R) else 1)
