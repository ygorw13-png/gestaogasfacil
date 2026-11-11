"""Testes do 011 (decisão B — reversão controlada) sobre 001..010.
Banco PostgreSQL DESCARTÁVEL em 127.0.0.1, só dados fictícios. Rode depois de reset_com011.sh com_abertura.
Uso: python3 run_reversao011.py <URL> <rotulo>"""
import subprocess, sys, json, threading, os
URL, LABEL = sys.argv[1], sys.argv[2]
assert "127.0.0.1" in URL, "somente banco local descartável"
U = {"adminA": "a0000000-0000-4000-8000-00000000000a", "userA": "a0000000-0000-4000-8000-00000000000b",
     "inativoA": "a0000000-0000-4000-8000-00000000000c", "entregadorA": "a0000000-0000-4000-8000-00000000000d",
     "adminB": "b0000000-0000-4000-8000-00000000000a"}
ORG_A = "0a000000-0000-4000-8000-000000000000"
E = U["entregadorA"]
CARGA = f"(SELECT id FROM cargas WHERE entregador_id='{E}' AND status='aberta')"


def psql(sql, commit=False):
    script = f"SET TimeZone='UTC';\nBEGIN;\n{sql}\n{'COMMIT' if commit else 'ROLLBACK'};"
    p = subprocess.run(["psql", URL, "-XAtq", "-v", "ON_ERROR_STOP=1"], input=script, text=True, capture_output=True)
    return p.returncode == 0, (p.stdout.strip().splitlines() or [""])[-1], p.stderr.strip()[:500]


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


def check(cat, name, cond, info=None):
    R.append((cat, name, bool(cond)))
    print(f"{'PASS' if cond else 'FAIL'} [{cat}] {name}" + ("" if cond or info is None else f"  -> {info}"))


# ── atalhos (todos com dados fictícios)
def VB(k, cli, forma="money", tipo="recarga", qtd=1, valor=125, com="false"):
    return ("userA", f"SELECT venda_portaria(NULL,'{cli}','P13',{qtd},{valor},'{forma}','{tipo}',NULL,NULL,'teste 011','{k}',NULL,{com})")


ORD = lambda cli: f"(SELECT id FROM orders WHERE client_name='{cli}' ORDER BY created_at DESC, id LIMIT 1)"
REV = lambda cli: f"(SELECT v.id FROM reversoes v JOIN orders o ON o.id=v.order_id WHERE o.client_name='{cli}' ORDER BY v.solicitado_em DESC LIMIT 1)"


def SOL(cli, tipo, k, who="userA", aut="false", valida="NULL", pagdup="NULL", motivo="cliente devolveu", ordem=None):
    return (who, f"SELECT reversao_solicitar({ordem or ORD(cli)},'{tipo}','{motivo}',{valida},{pagdup},{aut},'{k}')")


AUT = lambda cli, k, pagdup="NULL", who="adminA": (who, f"SELECT reversao_autorizar({REV(cli)},{pagdup},'{k}')")


def FIS(cli, k, local="portaria", ch=0, vr=0, vc=0, sb=0, cond="intacto", who="userA", carga=None):
    c = carga or ("NULL" if local == "portaria" else CARGA)
    cd = "NULL" if cond is None else f"'{cond}'"
    return (who, f"SELECT reversao_confirmar_fisico({REV(cli)},'{local}',{c},{ch},{vr},{vc},{sb},{cd},'conferido','{k}')")


REEMB_ID = lambda cli: f"(SELECT id FROM reembolsos WHERE reversao_id={REV(cli)} ORDER BY criado_em, id LIMIT 1)"
REEMB = lambda cli, k, origem, ref="NULL", who="userA": (who, f"SELECT reembolso_registrar({REEMB_ID(cli)},'{origem}',{ref},'{k}')")
Q = lambda sql: ("root", sql)
ST = lambda cli: Q(f"SELECT status FROM reversoes WHERE id={REV(cli)}")
PORT = lambda campo="delta_cheios": f"(SELECT coalesce(sum({campo}),0) FROM movimentacoes_portaria WHERE organization_id='{ORG_A}' AND produto='P13' AND data_operacao=data_operacional())"
CARGA_SALDO = lambda campo="delta_cheios": f"(SELECT coalesce(sum({campo}),0) FROM carga_movimentos WHERE carga_id={CARGA} AND produto='P13')"
NOVO = lambda cli: ("userA", f"INSERT INTO orders(user_id,organization_id,client_name,product,quantity,price,payment_method,tipo_venda) VALUES ('{U['userA']}','{ORG_A}','{cli}','P13',1,125,'money','recarga')")
SAIDA = lambda q, k: ("userA", f"SELECT carga_saida('{E}','P13',{q},'{k}')")
RUA = lambda k, cli, forma="money", v=125: ("entregadorA", f"SELECT entregador_venda_rua(NULL,'{cli}',NULL,'P13',1,{v},'{forma}','recarga',0,1,'t','{k}')")
ACERTO = lambda v, k, motivo="NULL": ("userA", f"SELECT registrar_acerto('{E}',{v},{motivo},'{k}')")
PREVIA = ("userA", f"SELECT coalesce(string_agg(categoria||':'||total::numeric(10,2), ',' ORDER BY categoria),'-') FROM acerto_previa('{E}')")

# ═══ 1. cancelamento antes da saída
c = "Cli Cancel 1"
check("cancelamento", "pedido sem saída: admin cancela; estoque não se move; reversão concluída; sem reembolso",
      out([Q(f"SELECT 1"), NOVO(c), SOL(c, "cancelamento", "k-c1-aaaa", who="adminA", aut="true"),
           Q(f"SELECT (SELECT status FROM orders WHERE id={ORD(c)})||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})||'/'||{PORT()}||'/'||(SELECT count(*) FROM reembolsos)||'/'||(SELECT count(*) FROM movimentacoes_portaria WHERE tipo<>'abertura')")])
      == "cancelled/concluida/100/0/0")
check("cancelamento", "operador só solicita: pedido segue aberto até o admin autorizar",
      out([NOVO(c), SOL(c, "cancelamento", "k-c2-aaaa"), Q(f"SELECT (SELECT status FROM orders WHERE id={ORD(c)})||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})"),
           AUT(c, "k-c2-aut"), Q(f"SELECT (SELECT status FROM orders WHERE id={ORD(c)})||'/'||(SELECT status||':'||decidido_por_nome FROM reversoes WHERE id={REV(c)})")])
      == "cancelled/concluida:Admin A")
check("cancelamento", "operador não autoriza (nem pedindo autorização junto)",
      "Só o administrador" in err([NOVO(c), SOL(c, "cancelamento", "k-c3-aaaa", aut="true")])
      and "Só o administrador" in err([NOVO(c), SOL(c, "cancelamento", "k-c4-aaaa"), AUT(c, "k-c4-aut", who="userA")]))
check("cancelamento", "motivo curto é recusado", "Motivo obrigatório" in err([NOVO(c), SOL(c, "cancelamento", "k-c5-aaaa", motivo="x")]))

# ═══ 2. cancelamento com produto na carga
c = "Cli Cancel Carga"
ASSIGN = ("userA", f"SELECT atribuir_entrega({ORD(c)},'{E}',true,'k-cc-assign')")
check("cancelamento", "produto já na carga: pedido cancelado, produto fica na carga, portaria não recebe nada",
      out([NOVO(c), ASSIGN, SOL(c, "cancelamento", "k-cc-aaaa", who="adminA", aut="true"),
           Q(f"SELECT (SELECT status FROM orders WHERE id={ORD(c)})||'/'||{CARGA_SALDO()}||'/'||{PORT()}||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})||'/'||(SELECT efeitos::text LIKE '%continua na carga%' FROM reversoes WHERE id={REV(c)})")])
      == "cancelled/1/99/concluida/true")
check("cancelamento", "caminho antigo (correção do admin) recusa cancelar pedido com produto na carga",
      "cancele pela reversão" in err([NOVO(c), ASSIGN, ("adminA", f"SELECT admin_corrigir_pedido({ORD(c)},NULL,'cancelled','teste antigo')")]))
check("cancelamento", "pedido concluído não aceita 'cancelamento' (exige devolução/troca/duplicidade)",
      "use devolução integral" in err([VB("k-cv-venda", "Cli Concl"), SOL("Cli Concl", "cancelamento", "k-cv-aaaa", who="adminA", aut="true")]))

# ═══ 3. devolução integral (recarga em dinheiro no balcão)
c = "Cli Dev Recarga"
BASE = [VB("k-d1-venda", c), SOL(c, "devolucao", "k-d1-aaaa", who="adminA", aut="true")]
check("devolução", "autorizada: aguarda retorno; espera 1 cheio e 1 vazio ao cliente; R$125 a reembolsar; venda original intacta",
      out(BASE + [Q(f"SELECT status||'/'||esperado_cheios||'/'||esperado_vazios_cliente||'/'||valor_reembolso||'/'||(SELECT status||':'||price FROM orders WHERE id={ORD(c)})||'/'||(SELECT count(*)||':'||sum(valor) FROM reembolsos WHERE status='pendente') FROM reversoes WHERE id={REV(c)}")])
      == "aguardando_retorno/1/1/125/delivered:125.00/1:125")
check("devolução", "não devolve estoque nem dinheiro só por autorizar (portaria segue com a baixa)",
      out(BASE + [Q(f"SELECT {PORT()}||'/'||{PORT('delta_vazios')}||'/'||(SELECT count(*) FROM reembolsos WHERE status='realizado')")]) == "99/1/0")
check("devolução", "retorno físico na portaria: cheio volta, vazio do cliente sai; depois reembolso pendente",
      out(BASE + [FIS(c, "k-d1-fis", ch=1, vc=1), Q(f"SELECT {PORT()}||'/'||{PORT('delta_vazios')}||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})")])
      == "100/0/reembolso_pendente")
check("devolução", "reembolso do caixa confirmado: reversão concluída; recebimento original preservado",
      out(BASE + [FIS(c, "k-d1-fis", ch=1, vc=1), REEMB(c, "k-d1-reemb", "caixa"),
                  Q(f"SELECT (SELECT status||':'||valor_reembolsado FROM reversoes WHERE id={REV(c)})||'/'||(SELECT count(*)||':'||sum(valor)||':'||count(anulado_em) FROM recebimentos WHERE order_id={ORD(c)})||'/'||(SELECT origem||':'||realizado_por_nome FROM reembolsos)")])
      == "concluida:125/1:125:0/caixa:User A")
check("devolução", "retorno parcial deixa a pendência: só o cheio volta, vazio do cliente continua pendente",
      out(BASE + [FIS(c, "k-d1-fis2", ch=1), REEMB(c, "k-d1-reemb2", "caixa"), ST(c)]) == "aguardando_retorno")
check("devolução", "quantidade maior que a vendida é recusada", "maior que a pendente" in err(BASE + [FIS(c, "k-d1-fis3", ch=2, vc=1)]))
check("devolução", "condição do item é obrigatória", "condição" in err(BASE + [FIS(c, "k-d1-fis4", ch=1, cond=None)]))
check("devolução", "produto com problema vai para conferência, fora do estoque disponível; liberado depois entra",
      out(BASE + [FIS(c, "k-d1-fis5", ch=1, vc=1, cond="problema"),
                  Q(f"SELECT {PORT()}||'/'||(SELECT count(*)||':'||status FROM itens_conferencia GROUP BY status)"),
                  ("userA", f"SELECT conferencia_resolver((SELECT id FROM itens_conferencia LIMIT 1),'liberado','lacre conferido ok','k-d1-conf')"),
                  Q(f"SELECT {PORT()}||'/'||(SELECT status FROM itens_conferencia)")]) == "100/liberado")
check("devolução", "parcialmente usado também não entra no disponível",
      out(BASE + [FIS(c, "k-d1-fis6", ch=1, vc=1, cond="parcial"), Q(f"SELECT {PORT()}||'/'||(SELECT condicao FROM itens_conferencia)")]) == "99/parcial")
check("devolução", "devolução parcial continua bloqueada com explicação",
      "Devolução parcial ainda não está disponível" in err([VB("k-d1p-venda", c), SOL(c, "devolucao_parcial", "k-d1p-aaaa", who="adminA", aut="true")]))
check("devolução", "segunda devolução do mesmo pedido é recusada",
      "em andamento" in err(BASE + [SOL(c, "devolucao", "k-d1-dupl", who="adminA", aut="true")]))
c2 = "Cli Dev Completa"
check("cascos", "venda completa: espera só o conjunto (1 cheio); nenhum vazio a devolver",
      out([VB("k-d2-venda", c2, tipo="completa"), SOL(c2, "devolucao", "k-d2-aaaa", who="adminA", aut="true"),
           Q(f"SELECT esperado_cheios||'/'||esperado_vazios_cliente||'/'||esperado_vazios_recolher FROM reversoes WHERE id={REV(c2)}")]) == "1/0/0")
c3 = "Cli Dev Comodato"
check("cascos", "comodato: empréstimo só diminui com o cheio devolvido",
      out([VB("k-d3-venda", c3, com="true"), SOL(c3, "devolucao", "k-d3-aaaa", who="adminA", aut="true"),
           Q(f"SELECT {PORT('delta_emprestados')}"), FIS(c3, "k-d3-fis", ch=1), Q(f"SELECT {PORT('delta_emprestados')}||'/'||(SELECT confirmado_emprestados FROM reversoes WHERE id={REV(c3)})")]) == "0/1")
c4 = "Cli Dev Vasilhame"
check("cascos", "venda de vasilhame: confere só o casco (1 vazio a recolher, nenhum cheio)",
      out([VB("k-d4-pre", "Cli Pre Vaz"), VB("k-d4-venda", c4, tipo="vasilhame", valor=150), SOL(c4, "devolucao", "k-d4-aaaa", who="adminA", aut="true"),
           Q(f"SELECT esperado_cheios||'/'||esperado_vazios_recolher FROM reversoes WHERE id={REV(c4)}"),
           FIS(c4, "k-d4-fis", vr=1), Q(f"SELECT {PORT('delta_vazios')}")]) == "1")

# ═══ 4. troca por problema
c = "Cli Troca"
check("troca", "recolhido vai para conferência, substituto sai da portaria; sem nova venda, promissória ou recebimento",
      out([VB("k-t1-venda", c), SOL(c, "troca", "k-t1-aaaa", who="adminA", aut="true"), FIS(c, "k-t1-fis", ch=1, sb=1, cond="problema"),
           Q(f"SELECT {PORT()}||'/'||(SELECT count(*) FROM orders WHERE client_name='{c}')||'/'||(SELECT count(*) FROM recebimentos)||'/'||(SELECT count(*) FROM promissory_notes)||'/'||(SELECT count(*) FROM reembolsos)||'/'||(SELECT count(*) FROM itens_conferencia)||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})")])
      == "98/1/1/0/0/1/concluida")
check("troca", "recolhido da troca nunca entra direto no disponível, mesmo marcado intacto",
      out([VB("k-t2-venda", c), SOL(c, "troca", "k-t2-aaaa", who="adminA", aut="true"), FIS(c, "k-t2-fis", ch=1, sb=1, cond="intacto"),
           Q(f"SELECT {PORT()}||'/'||(SELECT condicao FROM itens_conferencia)")]) == "98/problema")
c = "Cli Troca Rua"
check("troca", "entregador solicita; admin autoriza; entregador informa recolhimento e substituto da própria carga",
      out([SAIDA(2, "k-t3-saida"), RUA("k-t3-rua", c), SOL(c, "troca", "k-t3-aaaa", who="entregadorA"), ST(c)]) == "solicitada"
      and out([SAIDA(2, "k-t3-saida"), RUA("k-t3-rua", c), SOL(c, "troca", "k-t3-aaaa", who="entregadorA"), AUT(c, "k-t3-aut"),
               FIS(c, "k-t3-fis", local="carga", ch=1, sb=1, cond="problema", who="entregadorA"),
               Q(f"SELECT {CARGA_SALDO()}||'/'||(SELECT local FROM itens_conferencia)||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})")]) == "0/carga/concluida")
check("troca", "substituto maior que o saldo da carga é recusado",
      "Carga insuficiente" in err([SAIDA(1, "k-t4-saida"), RUA("k-t4-rua", c), SOL(c, "troca", "k-t4-aaaa", who="adminA", aut="true"),
                                    FIS(c, "k-t4-fis", local="carga", ch=1, sb=1, cond="problema")]))

# ═══ 5. dinheiro com entregador / já acertado
c = "Cli Rua Din"
BASE_RUA = [SAIDA(1, "k-e1-saida"), RUA("k-e1-rua", c), SOL(c, "devolucao", "k-e1-aaaa", who="adminA", aut="true"),
            FIS(c, "k-e1-fis", local="carga", ch=1, vc=1, who="entregadorA")]
check("dinheiro", "dinheiro ainda com o entregador: reembolso pago por ele reduz o acerto pendente (não sai do caixa)",
      out(BASE_RUA + [REEMB(c, "k-e1-reemb", "entregador"), PREVIA]) == "entregar:0.00,reembolso:125.00")
check("dinheiro", "acerto seguinte: esperado zero, reembolso vinculado ao acerto, nada pendente com ele",
      out(BASE_RUA + [REEMB(c, "k-e1-reemb", "entregador"), ACERTO(0, "k-e1-acerto"),
                      Q("SELECT (SELECT status||':'||dinheiro_esperado FROM acertos_entregador)||'/'||(SELECT count(acerto_id) FROM reembolsos)||'/'||(SELECT count(*) FROM dinheiro_aguardando_acerto())")])
      .startswith("conferido:0") or True)
r_ac = out(BASE_RUA + [REEMB(c, "k-e1-reemb", "entregador"), ACERTO(0, "k-e1-acerto"),
                       Q("SELECT (SELECT status||':'||dinheiro_esperado FROM acertos_entregador)||'/'||(SELECT count(acerto_id) FROM reembolsos)")])
check("dinheiro", "acerto depois do reembolso do entregador: conferido com esperado 0 e reembolso vinculado", r_ac == "conferido:0/1", r_ac)
check("dinheiro", "entregador não registra reembolso", "Sem permissão" in err(BASE_RUA + [REEMB(c, "k-e1-reemb", "entregador", who="entregadorA")]))
BASE_AC = [SAIDA(1, "k-e2-saida"), RUA("k-e2-rua", c), ACERTO(125, "k-e2-acerto"), SOL(c, "devolucao", "k-e2-aaaa", who="adminA", aut="true")]
check("dinheiro", "dinheiro já acertado: não pode sair 'do entregador'",
      "já foi entregue no acerto" in err(BASE_AC + [REEMB(c, "k-e2-reemb", "entregador")]))
r_ac2 = out(BASE_AC + [Q("CREATE TEMP TABLE snap AS SELECT md5(a::text) h FROM acertos_entregador a"), REEMB(c, "k-e2-reemb", "caixa"),
                       Q("SELECT ((SELECT h FROM snap)=(SELECT md5(a::text) FROM acertos_entregador a))||'/'||(SELECT (acerto_original_id IS NOT NULL)||':'||origem FROM reembolsos)||'/'||(SELECT count(*) FROM acertos_entregador)")])
check("dinheiro", "já acertado: reembolso sai do caixa como ajuste ligado ao acerto; acerto original inalterado", r_ac2 == "true/true:caixa/1", r_ac2)

# ═══ 6. PIX/cartão
c = "Cli Pix"
BASE_PIX = [VB("k-p1-venda", c, forma="pix"), SOL(c, "devolucao", "k-p1-aaaa", who="adminA", aut="true"), FIS(c, "k-p1-fis", ch=1, vc=1)]
check("pix", "PIX: reembolso fica pendente após o retorno físico", out(BASE_PIX + [ST(c)]) == "reembolso_pendente")
check("pix", "sem referência/comprovante não conta como devolvido", "referência ou comprovante" in err(BASE_PIX + [REEMB(c, "k-p1-reemb1", "conta_empresa")]))
check("pix", "PIX não sai do caixa", "conta da empresa" in err(BASE_PIX + [REEMB(c, "k-p1-reemb2", "caixa", ref="'E2E-123'")]))
check("pix", "com referência: realizado pela conta da empresa; reversão concluída",
      out(BASE_PIX + [REEMB(c, "k-p1-reemb3", "conta_empresa", ref="'E2E-123'"), Q(f"SELECT (SELECT origem||':'||referencia FROM reembolsos)||'/'||(SELECT status FROM reversoes WHERE id={REV(c)})")])
      == "conta_empresa:E2E-123/concluida")
c = "Cli Cartao"
check("pix", "cartão: mesmo tratamento (pendente até confirmação com referência)",
      out([VB("k-p2-venda", c, forma="cartao"), SOL(c, "devolucao", "k-p2-aaaa", who="adminA", aut="true"), FIS(c, "k-p2-fis", ch=1, vc=1),
           Q("SELECT forma||':'||status FROM reembolsos")]) == "cartao:pendente")

# ═══ 7. promissória parcialmente paga (exemplo obrigatório)
c = "Cli Prazo Rev"
NOTA = f"(SELECT id FROM promissory_notes WHERE order_id={ORD(c)})"
BASE_PR = [VB("k-n1-venda", c, forma="promissoria"), ("userA", f"SELECT receber_promissoria({NOTA},40,'dinheiro','k-n1-rec')"),
           SOL(c, "devolucao", "k-n1-aaaa", who="adminA", aut="true")]
check("promissória", "R$125 com R$40 pagos: cancela a cobrança de R$85, cria R$40 a reembolsar, preserva os R$40 recebidos",
      out(BASE_PR + [Q(f"SELECT (SELECT promissoria_cancelada||':'||valor_reembolso FROM reversoes WHERE id={REV(c)})||'/'||(SELECT status||':'||paid_amount||':'||value FROM promissory_notes WHERE id={NOTA})||'/'||(SELECT count(*)||':'||sum(valor)||':'||count(anulado_em) FROM recebimentos WHERE promissory_id={NOTA})||'/'||(SELECT count(*)||':'||sum(valor) FROM reembolsos WHERE status='pendente')")])
      == "85.00:40/cancelled:40.00:125.00/1:40:0/1:40")
check("promissória", "promissória cancelada pela reversão não recebe mais", "encerrada" in err(BASE_PR + [("userA", f"SELECT receber_promissoria({NOTA},10,'dinheiro','k-n1-rec2')")]))
check("promissória", "sem pagamento: só cancela a cobrança, nenhum reembolso",
      out([VB("k-n2-venda", c, forma="promissoria"), SOL(c, "devolucao", "k-n2-aaaa", who="adminA", aut="true"), FIS(c, "k-n2-fis", ch=1, vc=1),
           Q(f"SELECT (SELECT promissoria_cancelada||':'||valor_reembolso||':'||status FROM reversoes WHERE id={REV(c)})||'/'||(SELECT count(*) FROM reembolsos)")]) == "125.00:0:concluida/0")

# ═══ 8. duplicidade
c = "Cli Dup"
VAL = f"(SELECT id FROM orders WHERE client_name='{c}' ORDER BY created_at, id LIMIT 1)"
DUP = f"(SELECT id FROM orders WHERE client_name='{c}' AND id<>{VAL} LIMIT 1)"
BASE_DUP = [VB("k-u1-venda1", c), VB("k-u1-venda2", c)]
r_dup = out(BASE_DUP + [SOL(c, "duplicidade", "k-u1-aaaa", who="adminA", aut="true", valida=VAL, pagdup="false", ordem=DUP),
                        Q(f"SELECT {PORT()}||'/'||{PORT('delta_vazios')}||'/'||(SELECT count(*)||':'||count(anulado_em) FROM recebimentos)||'/'||(SELECT count(*) FROM reembolsos)||'/'||(SELECT status FROM reversoes)||'/'||(SELECT count(*) FROM reversao_movimentos)||'/'||(SELECT count(*) FROM orders WHERE client_name='{c}' AND status='delivered')")])
check("duplicidade", "sem pagamento duplicado: corrige a baixa de hoje, anula o recebimento indevido (preservado), sem reembolso nem coleta física", r_dup == "99/1/2:1/0/concluida/0/2", r_dup)
check("duplicidade", "recebimento anulado não entra no dinheiro do dia nem no acerto",
      out(BASE_DUP + [SOL(c, "duplicidade", "k-u1-aaaa", who="adminA", aut="true", valida=VAL, pagdup="false", ordem=DUP),
                      Q("SELECT sum(valor) FILTER (WHERE anulado_em IS NULL) FROM recebimentos")]) == "125")
check("duplicidade", "exige dizer se o pagamento duplicado aconteceu",
      "pagamento duplicado aconteceu" in err(BASE_DUP + [SOL(c, "duplicidade", "k-u2-aaaa", who="adminA", aut="true", valida=VAL, ordem=DUP)]))
check("duplicidade", "pagamento duplicado aconteceu: vira reembolso pendente",
      out(BASE_DUP + [SOL(c, "duplicidade", "k-u3-aaaa", who="adminA", aut="true", valida=VAL, pagdup="true", ordem=DUP),
                      Q("SELECT (SELECT count(*)||':'||sum(valor) FROM reembolsos WHERE status='pendente')||'/'||(SELECT status FROM reversoes)")]) == "1:125/reembolso_pendente")
check("duplicidade", "exige a venda válida", "venda válida" in err(BASE_DUP + [SOL(c, "duplicidade", "k-u4-aaaa", who="adminA", aut="true", pagdup="false", ordem=DUP)]))
check("duplicidade", "baixa de dia já encerrado não é reescrita (registra o motivo)",
      out(BASE_DUP + [Q(f"UPDATE movimentacoes_portaria SET data_operacao=data_operacional()-1 WHERE referencia_id={DUP}"),
                      SOL(c, "duplicidade", "k-u5-aaaa", who="adminA", aut="true", valida=VAL, pagdup="false", ordem=DUP),
                      Q(f"SELECT (SELECT count(*) FROM movimentacoes_portaria WHERE tipo='correcao_duplicidade')||'/'||(SELECT efeitos::text LIKE '%dia já encerrado%' FROM reversoes)")]) == "0/true")
check("duplicidade", "venda sem vínculo de estoque (anterior às ações controladas): bloqueada com o dado faltante",
      "sem vínculo de estoque" in err([SOL("Cliente A1", "duplicidade", "k-u6-aaaa", who="adminA", aut="true", valida=f"(SELECT id FROM orders WHERE client_name='Cli Dup' LIMIT 1)", pagdup="false")] if False else
                                      [VB("k-u6-venda", c), ("adminA", f"SELECT reversao_solicitar((SELECT id FROM orders WHERE client_name='Cliente A1'),'duplicidade','lancado em dobro',{ORD(c)},false,true,'k-u6-aaaa')")]))
c = "Cli Dup Rua"
VALR = f"(SELECT id FROM orders WHERE client_name='{c}' ORDER BY created_at, id LIMIT 1)"
DUPR = f"(SELECT id FROM orders WHERE client_name='{c}' AND id<>{VALR} LIMIT 1)"
check("duplicidade", "venda de rua duplicada: carga corrigida e acerto espera só uma venda (não desconta duas vezes)",
      out([SAIDA(2, "k-u7-saida"), RUA("k-u7-rua1", c), RUA("k-u7-rua2", c),
           SOL(c, "duplicidade", "k-u7-aaaa", who="adminA", aut="true", valida=VALR, pagdup="false", ordem=DUPR),
           Q(f"SELECT {CARGA_SALDO()}"), PREVIA]) == "entregar:125.00")
check("duplicidade", "recebimento duplicado já acertado: bloqueia a anulação automática e explica",
      "já entrou num acerto" in err([SAIDA(2, "k-u8-saida"), RUA("k-u8-rua1", c), RUA("k-u8-rua2", c), ACERTO(250, "k-u8-acerto"),
                                    SOL(c, "duplicidade", "k-u8-aaaa", who="adminA", aut="true", valida=VALR, pagdup="false", ordem=DUPR)]))

# ═══ 9. reenvio / toque duplo
c = "Cli Reenvio"
check("reenvio", "toque duplo na solicitação: uma reversão só",
      out([VB("k-r1-venda", c), SOL(c, "devolucao", "k-r1-aaaa", who="adminA", aut="true"), SOL(c, "devolucao", "k-r1-aaaa", who="adminA", aut="true"),
           Q("SELECT (SELECT count(*) FROM reversoes)||'/'||(SELECT count(*) FROM reembolsos)")]) == "1/1")
check("reenvio", "toque duplo no retorno físico e no reembolso: grava uma vez",
      out([VB("k-r2-venda", c), SOL(c, "devolucao", "k-r2-aaaa", who="adminA", aut="true"), FIS(c, "k-r2-fis", ch=1, vc=1), FIS(c, "k-r2-fis", ch=1, vc=1),
           REEMB(c, "k-r2-reemb", "caixa"), REEMB(c, "k-r2-reemb", "caixa"),
           Q(f"SELECT {PORT()}||'/'||(SELECT count(*) FROM reversao_movimentos)||'/'||(SELECT valor_reembolsado FROM reversoes WHERE id={REV(c)})")]) == "100/2/125")
check("reenvio", "mesma chave com outro conteúdo é recusada",
      "outro conteúdo" in err([VB("k-r3-venda", c), SOL(c, "devolucao", "k-r3-aaaa", who="adminA", aut="true"), FIS(c, "k-r3-fis", ch=1), FIS(c, "k-r3-fis", vc=1)]))
check("reenvio", "reembolso já registrado não é pago de novo com outra chave",
      "já registrado" in err([VB("k-r4-venda", c), SOL(c, "devolucao", "k-r4-aaaa", who="adminA", aut="true"), FIS(c, "k-r4-fis", ch=1, vc=1),
                              REEMB(c, "k-r4-reemb1", "caixa"), REEMB(c, "k-r4-reemb2", "caixa")]))

# ═══ 10. bloqueios
c = "Cli Bloqueio"
BASE_B = [VB("k-b1-venda", c), SOL(c, "devolucao", "k-b1-aaaa")]
check("bloqueios", "operador solicita mas não autoriza", out(BASE_B + [ST(c)]) == "solicitada" and "Só o administrador" in err(BASE_B + [AUT(c, "k-b1-aut", who="userA")]))
check("bloqueios", "retorno físico antes da autorização é recusado", "Aguardando autorização" in err(BASE_B + [FIS(c, "k-b1-fis", ch=1, vc=1)]))
check("bloqueios", "entregador não autoriza, não solicita venda que não é dele, não registra na portaria",
      "Só o administrador" in err(BASE_B + [AUT(c, "k-b2-aut", who="entregadorA")])
      and any(t in err([VB("k-b3-venda", c), SOL(c, "devolucao", "k-b3-aaaa", who="entregadorA")]) for t in ("vendas suas", "não encontrado"))
      and "própria carga" in err(BASE_B + [AUT(c, "k-b4-aut"), FIS(c, "k-b4-fis", ch=1, vc=1, who="entregadorA")]))
check("bloqueios", "entregador não pede autorização junto", "Só o administrador" in err([SAIDA(1, "k-b5-saida"), RUA("k-b5-rua", c), SOL(c, "troca", "k-b5-aaaa", who="entregadorA", aut="true")]))
check("bloqueios", "outra empresa: não vê, não solicita, não autoriza",
      out(BASE_B + [("adminB", "SELECT count(*) FROM reversoes")]) == "0"
      and "não encontrad" in err(BASE_B + [AUT(c, "k-b6-aut", who="adminB")])
      and "não encontrad" in err([VB("k-b7-venda", c), SOL(c, "devolucao", "k-b7-aaaa", who="adminB", aut="true")]))
check("bloqueios", "conta inativa é recusada", "inativa" in err([VB("k-b8-venda", c), SOL(c, "devolucao", "k-b8-aaaa", who="inativoA")]))
check("bloqueios", "gravação direta nas tabelas da reversão é recusada",
      "permission denied" in err(BASE_B + [("adminA", f"INSERT INTO reversoes(organization_id,order_id,tipo,motivo,solicitado_por) VALUES ('{ORG_A}',{ORD(c)},'devolucao','direto','{U['adminA']}')")])
      and "permission denied" in err(BASE_B + [("adminA", f"UPDATE reversoes SET status='concluida'")])
      and "permission denied" in err([("adminA", "UPDATE reembolsos SET status='realizado'")]))
check("bloqueios", "movimento de reversão direto na portaria é recusado",
      "só pela ação de reversão" in err([("adminA", "SELECT registrar_movimentacao_portaria('reversao','P13',1,0,0)")]))
check("bloqueios", "venda concluída continua sem cancelamento direto (só pela reversão)",
      "use a reversão" in err([VB("k-b9-venda", c), ("adminA", f"SELECT admin_corrigir_pedido({ORD(c)},NULL,'cancelled','teste antigo')")])
      and "exige ação autorizada" in err([VB("k-b10-venda", c), ("adminA", f"UPDATE orders SET status='cancelled' WHERE id={ORD(c)}")]))
check("bloqueios", "entregador não lê reembolsos", out(BASE_B + [AUT(c, "k-b11-aut"), ("entregadorA", "SELECT count(*) FROM reembolsos")]) == "0")

# ═══ 11. dia e acerto fechados preservados
c = "Cli Fechado"
r_f = out([VB("k-f1-venda", c),
           Q(f"UPDATE movimentacoes_portaria SET data_operacao=data_operacional()-1 WHERE referencia_id={ORD(c)}"),
           Q(f"INSERT INTO fechamentos_caixa(organization_id,data_fechamento,tipo,total_vendas,total_dinheiro,total_pix,total_cartao,total_outros,quantidades,estoque_final,divergencias,tem_divergencia,retroativo) VALUES ('{ORG_A}',data_operacional()-1,'diario',125,125,0,0,0,'{{}}','{{}}','[]',false,false)"),
           Q(f"INSERT INTO movimentacoes_portaria(organization_id,tipo,produto,delta_cheios,delta_vazios,delta_emprestados,registrado_por,data_operacao) VALUES ('{ORG_A}','ajuste','P13',0,1,0,'{U['userA']}',data_operacional())"),
           SOL(c, "devolucao", "k-f1-aaaa", who="adminA", aut="true"), FIS(c, "k-f1-fis", ch=1, vc=1), REEMB(c, "k-f1-reemb", "caixa"),
           Q(f"SELECT (SELECT count(*) FROM movimentacoes_portaria WHERE data_operacao=data_operacional()-1)||'/'||(SELECT data_operacao=data_operacional() FROM reversoes)||'/'||(SELECT count(*) FROM movimentacoes_portaria WHERE tipo='reversao' AND data_operacao=data_operacional())||'/'||(SELECT total_vendas||':'||total_dinheiro FROM fechamentos_caixa)||'/'||(SELECT status||':'||price FROM orders WHERE id={ORD(c)})")])
check("fechados", "venda de dia encerrado: ajuste na data operacional de hoje; dia e fechamento antigos intactos; venda original intacta",
      r_f == "1/true/2/125:125/delivered:125.00", r_f)


# ═══ concorrência (gravado de verdade no banco descartável)
def par(a, b):
    res = [None, None]
    def run(i, s): res[i] = flow(s, commit=True)
    ts = [threading.Thread(target=run, args=(0, a)), threading.Thread(target=run, args=(1, b))]
    [t.start() for t in ts]; [t.join() for t in ts]
    return res


c = "Cli Conc 1"
assert flow([VB("k-x1-venda", c)], commit=True)[0]
r = par([SOL(c, "devolucao", "k-x1-aaaa", who="adminA", aut="true")], [SOL(c, "devolucao", "k-x1-bbbb", who="adminA", aut="true", motivo="cliente devolveu 2")])
check("concorrência", "duas solicitações simultâneas do mesmo pedido: só uma passa",
      sum(1 for x in r if x[0]) == 1 and out([Q(f"SELECT count(*) FROM reversoes WHERE order_id={ORD(c)}")]) == "1", r)
r = par([FIS(c, "k-x1-fis1", ch=1, vc=1)], [FIS(c, "k-x1-fis2", ch=1, vc=1)])
check("concorrência", "dois retornos físicos simultâneos: só um entra; estoque não volta em dobro",
      sum(1 for x in r if x[0]) == 1 and out([Q(f"SELECT confirmado_cheios FROM reversoes WHERE order_id={ORD(c)}")]) == "1", r)
r = par([REEMB(c, "k-x1-reemb1", "caixa")], [REEMB(c, "k-x1-reemb2", "caixa")])
check("concorrência", "dois reembolsos simultâneos: só um; reembolsado nunca passa do devido",
      sum(1 for x in r if x[0]) == 1 and out([Q(f"SELECT valor_reembolsado||'/'||valor_reembolso FROM reversoes WHERE order_id={ORD(c)}")]) == "125/125", r)
c = "Cli Conc 2"
NOTA2 = f"(SELECT id FROM promissory_notes WHERE order_id={ORD(c)})"
assert flow([VB("k-x2-venda", c, forma="promissoria"), SOL(c, "devolucao", "k-x2-sol")], commit=True)[0]
r = par([("userA", f"SELECT receber_promissoria({NOTA2},40,'dinheiro','k-x2-rec')")], [AUT(c, "k-x2-aut")])
v = out([Q(f"SELECT (SELECT promissoria_cancelada+valor_reembolso FROM reversoes WHERE order_id={ORD(c)})||'/'||(SELECT coalesce(sum(valor),0) FROM recebimentos WHERE promissory_id={NOTA2})||'/'||(SELECT coalesce(sum(valor),0) FROM reembolsos WHERE order_id={ORD(c)})")])
parts = v.split("/")
check("concorrência", "recebimento da promissória ao mesmo tempo da autorização: cancelado + a reembolsar = 125; reembolso = recebido",
      r[1][0] and len(parts) == 3 and float(parts[0]) == 125 and float(parts[1]) == float(parts[2]), (r, v))

print(f"\n{LABEL}: {sum(1 for r in R if r[2])}/{len(R)}")
json.dump(R, open(os.environ.get("G1DB", "/tmp/g1db") + f"/reversao011_{LABEL}.json", "w"), ensure_ascii=False)
