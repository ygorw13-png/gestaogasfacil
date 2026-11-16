# GásFácil: checklist único

**Implantado 11/11/2026:** 001–010 no Cloud, frontend publicado com ações controladas ligadas.
Ver `IMPLANTACAO_G1_010.md`. Pendentes: decisão B, decisão 13, PIX/cartão, criação de colaborador, sessão G0.1.

**Atualização 11/11/2026 — 010:** integração essencial de bloqueios diretos e fila concluída;
43/43 SQL, 14/14 regressão de estoque, 71/71 frontend, TypeScript e build aprovados.
Nada publicado; limites e próximo passo em `CONTINUIDADE_G1_010.md`.


Atualizado em 10/11/2026, branch `claude/continuidade-g1-integracao-telas`. Este é **o** checklist: substitui a seção de estado de `g1/CHECKLIST.md` e complementa o `HANDOFF_CLAUDE.md`.

Colunas:
- **Implementado**: está no código da branch.
- **Testado**: testes executados nesta sessão em PostgreSQL 16 descartável (127.0.0.1, dados fictícios), ou pelo adaptador do Node para módulos puros. Teste preparado, mas não executado, aparece como "preparado".
- **Publicado**: em produção. **Nada desta branch foi publicado nem aplicado ao banco real.**

## Atualização G1 011 — decisão B, 11/11/2026
| Item | Implementado | Testado | Publicado |
|---|---|---|---|
| Cancelamento de pedido (sem saída / produto na carga / pagamento antecipado → reembolso pendente) | sim | SQL 67/67 | Cloud aplicado; frontend publicado |
| Devolução integral (cheios, vazios ao cliente, comodato, só vasilhame) | sim | SQL + navegador isolado 10/10 | idem |
| Troca integral por problema (recolhido em conferência, substituto do local real) | sim | SQL | idem |
| Duplicidade (com e sem pagamento duplicado; dia encerrado não reescrito) | sim | SQL | idem |
| Reembolso: dinheiro (caixa/entregador/cobrador, já acertado → caixa), PIX/cartão com referência | sim | SQL + navegador | idem |
| Promissória parcialmente paga (R$125, R$40 pagos → cancela R$85, R$40 a reembolsar) | sim | SQL + navegador | idem |
| Toque duplo e concorrência; bloqueios operador/entregador/outra empresa | sim | SQL | idem |
| Devolução parcial | **bloqueada com explicação** | SQL + navegador | — |
| Diferença de preço na troca, decisão 13 | fora desta entrega | — | — |
Regressões após 011: caminhos 43/43, acerto 43/43, regressão 14/14, carga 31/31, portaria 38/38, integração 40/40 (mensagens B atualizadas),
permissões 69/69, segurança 26/27 (mesma diferença já existente no 010). Detalhes: `docs/IMPLANTACAO_G1_011.md`.

## Atualização G1 009 — 10/11/2026

Candidato 009 bloqueia venda sem abertura/saldo (cheios e vazios): PostgreSQL 16.4 **14/14**, incluindo
concorrência venda × venda e venda × carga. Scripts de reset interrompem na falha (**12 cenários**).
Frontend `src/lib`: **64/64**; TypeScript e build passaram. A suíte geral permanece com falhas.
PIX/cartão empresa e acerto diário configurável: decisão conhecida, implementação pendente.
Nada publicado. Relatório atual: `docs/CONTINUIDADE_G1_009.md`; os limites históricos abaixo não
substituem estes resultados recentes.

## 1. Núcleo operacional

| Fluxo | Implementado | Testado | Pendente | Publicado |
|---|---|---|---|---|
| Venda de balcão (caixa e venda rápida), todos os tipos | Sim (L1): `completa` canônico, envio aguardado, chave presa ao conteúdo, cascos e comodato | SQL 37/37; puros 19/19 | Telas no navegador; agregado/ponto a prazo sem valor com G1 (dec. 13) | Não |
| Pedido novo | Sim (L1): reenvio pelo id da chave; dois produtos recusados (antes perdia o segundo) | Puros (chave) | Navegador | Não |
| Atribuição, aceite, recusa, reatribuição, conclusão | Sim (004 + L3): origem do produto explícita, nome em vez de ID, chave da tela | SQL 004 40/40; 006 38/38 | Navegador | Não |
| Transferência portaria → carga | Sim (L2, L3): abertura e saldo obrigatórios, trava, data Bahia, tela de saída avulsa | SQL 006 38/38 (concorrência real) | Bloqueio implementado no candidato 009; 14/14 SQL, navegador pendente | Não |
| Saldo e histórico da carga; devolução da sobra | Sim (L3): telas do operador e do entregador | SQL 007 31/31 | Navegador; encerramento de carga | Não |
| Venda na rua | Sim (004/005/007): consome a carga certa (vasilhame consome vazio), chave presa ao conteúdo, carga visível | SQL 005 e 007 | Navegador; offline com carga insuficiente aparece como "Recusado" (implementado, não exercitado) | Não |
| Promissórias: manual, cobrador por ID, recebimento parcial e total | Sim (L4) | SQL 008 43/43; puros 6/6 | Navegador; prestação de contas do cobrador | Não |
| Destino do dinheiro (caixa, entregador, cobrador, não informado) | Sim (L4) | SQL 008 | **Decisão 7** (PIX/cartão) | Não |
| Acerto dos entregadores (registrado, sem duplicar, divergência com motivo) | Sim (L4) | SQL 008 (cenário completo e concorrência) | Dec. 7 (periodicidade e PIX); correção de acerto; vínculo com o fechamento de caixa | Não |
| Data operacional America/Bahia | Portaria, caixa, carga, promissórias e painel (L2, L4) | SQL 006; puros 5/5 (máquina em UTC e em Tóquio) | Demais telas (pedidos, relatórios, Excel); `fechamento-portaria-automatico` (não editado: implantação automática) | Não |
| Fila offline: dono do lançamento, recusa visível, entregador vê a fila | Sim | Puros 9/9 | Teste de navegador de troca de conta; testes vitest da fila não rodados | Não |
| Rotas diretas que não gravavam (`/orders/new`, `/entrance/new-sale`, `/entrance/cashier`, `/orders/:id`) | Sim: redirecionam para as telas reais | — | Navegador | Não |

## 2. Segurança e permissões (backend)

| Item | Implementado | Testado | Publicado |
|---|---|---|---|
| Isolamento por empresa, conta inativa sem acesso (002) | Candidato | `run_security` 26/27 (1 diferença intencional) | Não |
| Papéis, carga, a prazo, gatilhos contra preço, cancelamento e quitação diretos (003) | Candidato | `run_permissoes` 69/69 | Não |
| Telas integradas, decisões A, C e D, bloqueios da decisão B (004) | Candidato | `run_integracao` 40/40 | Não |
| 005 tipo de venda e reenvio por conteúdo | Candidato | 37/37 | Não |
| 006 saldo da portaria e data operacional | Candidato | 38/38 | Não |
| 007 carga (devolução, consultas, vasilhame na rua) | Candidato | 31/31 | Não |
| 008 promissórias, destino, acerto | Candidato | 43/43 | Não |
| G0.1 perfil/sessão e administração | Candidato | Não reexecutado nesta sessão (relatado: 59/59 e 68/68) | Não |
| Gateway hospedado do Lovable Cloud | — | **Nunca verificado** | — |

Para reproduzir: `G1DB=<pasta fora do repo> bash g1/tests/sql/reset_com008.sh [com_abertura]` e depois `python3 g1/tests/sql/<suite>.py "postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable" rotulo`. Use `com_abertura` para as suítes 004, 005 e permissões, escritas antes da exigência de abertura. As suítes recusam qualquer URL fora de 127.0.0.1.

## 3. Não executado nesta sessão (motivo: sem `node_modules` e com a rede bloqueada para instalar)

- `vitest` do projeto, `tsc`, `eslint` e `vite build`. Foi feita checagem sintática dos arquivos alterados (TypeScript 6 global, 0 erros) e uma checagem de tipos parcial, com pacotes externos tratados como `any`.
- Navegador com frontend e backend isolados (PostgREST + gateway + build).
- Testes de integração G0.1 e os lotes de navegador do G1.

**Testes legados (7 falhas relatadas)**: analisados estaticamente, não executados.
- `LoginForm.test` e `Login.test` procuram textos que não existem mais ("GásFácil", "Faça login para acessar o sistema", "Credenciais inválidas"). Teste desatualizado.
- `checkbox.test` usa `onChange` num Checkbox Radix, que dispara `onCheckedChange`. Teste errado para o componente.
- `UserList.test` usa o papel inexistente `colaborador`; os papéis são `admin`, `user` e `entregador`.
- `useSupabaseQuery` e `useSupabaseCRUD` testam hooks genéricos usados só por exemplos.

Nenhum indica regressão funcional. A correção recomendada é atualizar os testes de login e usuários para os textos e papéis atuais, e remover os hooks genéricos junto com seus testes.

## 4. Revisar (sem bloquear o núcleo)

- Operador muda o status do pedido `pending`↔`delivering` direto, sem histórico.
- Botões de "excluir" que o banco vai recusar com G1 (troca de cheque, veículos). Trocar por "desativar" ou esconder.
- `useEntregadoresApp` usa `profiles.role`; o banco usa `user_roles`. Alinhar a origem do papel.
- Promissórias de nome "avulso" e de revendedores ficam ocultas na tela de promissórias, mas contam no saldo a receber do painel.
- Limpezas da Etapa 10: `RouteReports` órfão, avisos de configurações sem efeito, `dashboard_data` e os hooks genéricos.
- Fechamento de caixa somando o dinheiro dos acertos do dia (depende da decisão 10).

## 5. Decisões que bloqueiam a próxima entrega

Ver `docs/DECISOES_PENDENTES.md`.

## G1 012 — fluxo de entregas (12/11/2026)
- Implementado e testado: SQL 72/72, navegador 24/24, regressões verdes (ver `docs/IMPLANTACAO_G1_012.md`).
- Aplicado no Cloud (0011) com cópia de segurança conferida; publicado.
- Pendente: decisão administrativa dos 8 registros antigos de entrega.

## Lote 013 — bloqueio do fechamento total sem limite de antiguidade (12/11/2026)
- Implementado: entrega aberta com data ≤ dia do fechamento bloqueia (sem data prevista = dia operacional da criação); futuras, balcão, concluídas e canceladas fora. Mesma regra no banco, na lista e na mensagem do caixa. Trava consultiva mantida. Nada é alterado nos pedidos.
- Testado (127.0.0.1, fictício): `run_bloqueio013` 17/17, `run_entregas012` 72/72 (2 expectativas da regra antiga atualizadas), `run_security` 27/27 (expectativa do entregador ajustada à restrição intencional do 003, sem mudar permissões).
- Publicado: Cloud `0012_g1_013_bloqueio_fechamento_sem_limite.sql` + frontend.
- Pendente: os 8 registros antigos (12/08 e 09/09) seguem em "Revisão necessária", sem regularização auditada, e bloqueiam o fechamento total até decisão individual do proprietário.

## Lote 014 — formas de pagamento e aviso do entregador (16/11/2026)
- Causa: na Portaria, Gás do Povo (e seleção vazia) virava "Convênio", que o banco tratava como promissória; vale-gás/Gás do Povo eram recusados pela ação controlada; o aviso do entregador e a cópia offline disputavam o mesmo espaço no navegador.
- Implementado: código único por forma (`src/lib/formasPagamento.ts` = `public._forma_pedido`); valor obrigatório (> 0) para dinheiro, PIX, crédito, débito, promissória; opcional (vazio = "Não informado", sem recebimento/promissória) para vale-gás, Gás do Povo, convênio; forma inválida = erro. Aviso: `send-push` lê o destinatário do pedido no banco (atribuição e reatribuição), worker próprio em `/push/`, "Ativar notificações"/"Testar aviso", toque abre o pedido, lembrete confere o servidor antes de tocar.
- Testado (127.0.0.1, fictício): `run_formas014` 38/38, `run_security` 27/27, navegador `g1_014_browser` 20/20, `g1_014_avisos_browser` 7/7, aviso `g1/tests/push/run_push014.py` 11/11, vitest 44/44.
- Publicado: Cloud `0013_g1_014_formas_pagamento.sql` + função `send-push` + frontend.
- Pendente: conferência no Android real (aberto, segundo plano, tela bloqueada); venda 9899b5ca (16/11, R$ 108, gravada como convênio com promissória 79322b47) e vendas antigas "convênio" da Portaria podem ser Gás do Povo — decisão do proprietário; nada foi reclassificado.

## Lote 015 — correção administrativa da forma de pagamento (16/11/2026)
- Implementado: `admin_corrigir_forma_pagamento` (só admin, motivo, chave); muda só a forma; cancela apenas a promissória vinculada à venda, criada na mesma transação, mesmo valor, totalmente em aberto; demais casos bloqueiam para conciliação. Tela "Editar venda" usa a ação; produto/quantidade travados.
- Testado (127.0.0.1, fictício): `run_forma015` 23/23 (inclui toque duplo simultâneo), `run_reversao011` 67/67, `run_formas014` 38/38.
- Publicado: Cloud `0014_g1_015_corrigir_forma_pagamento.sql` + frontend. Pendente: o administrador confirmar a correção da venda #9899B5CA na tela (não foi feita por mim).

## Lote — nomes das formas e comissões (16/11/2026)
- [x] `nomeForma` único (8 nomes) em Detalhes do pedido, Detalhes da entrega, Compras do cliente, cartão do entregador e formulários impressos; códigos gravados intactos.
- [x] Comissões: Dinheiro/Crédito/Débito pelo código canônico; taxa 0 válida; Vale-gás/Gás do Povo/Convênio/desconhecida ficam "sem taxa configurada" (não comissionadas, sem "outros"); promissória só no recebimento.
- [x] Testes: formasPagamento 8/8, comissões 5/5. Sem fechamentos de comissão salvos (impacto histórico nenhum).
- [ ] Telas não conferidas no navegador (sem sessão de teste).

## Correção — Venda Regular em promissória para ponto (16/11/2026)
- [x] Ser ponto não zera o valor: Venda Regular grava o total informado; id de ponto não vai como cliente (só o nome); sem lançamento duplicado na ficha do parceiro. Agregado "a acertar" segue bloqueado (decisão 13). Promissória exige cliente e total > 0.
- [x] Testes: unitário 4/4; banco isolado `run_venda_regular_ponto.py` 10/10.

## Lote — aviso de entrega pelo WhatsApp oficial (candidato 016, 16/11/2026)
- [x] Canal obrigatório na atribuição/reatribuição: App + WhatsApp; Só WhatsApp visível e recusado (sem recebimento de respostas nesta versão).
- [x] Telefone só pelo vínculo colaborador ↔ conta (admin); fila `whatsapp_envios` gravada junto com a atribuição; reatribuição cancela pendentes do anterior.
- [x] `whatsapp-envio` (servidor) e `whatsapp-admin` (Configurações > WhatsApp, só admin). Estados: aguardando, enviado à plataforma, falha, incerto, cancelado.
- [x] Testes: banco isolado `run_aviso016.py` 25/25, segurança 27/27; unitários 10/10.
- [x] Configurações > WhatsApp: número de teste da Meta (+1 555/sandbox) marcado como teste; envio automático só liga (no servidor, `whatsapp-admin` acao `ativar`) com número real e modelo APPROVED; custo exibido; unitários 8/8. Publicado.
- [ ] Só WhatsApp, aceite/recusa e Entregue/Lido: exigem receber webhooks (não disponível nesta pilha; depende de atualizar o app). Número real da empresa: aguarda o administrador conectar.
- [ ] Conectar o WhatsApp Business da empresa, criar/aprovar o modelo, ativar o envio (custo Meta por mensagem). Entregue/Lido e aceite pelo WhatsApp dependem de receber respostas (atualização do app).
- [ ] Telas não conferidas no navegador (sem sessão de teste).

## Lote QR (Evolution, opcional)
- Implementado: Configurações > WhatsApp > "Conectar por QR" (admin), função `whatsapp-qr` (estado/conectar), "Servidor não configurado" sem secrets.
- Testado: `whatsapp-qr-core.test.ts` 8/8 (mocks), função recusa sem login (401).
- Pendente: servidor Evolution + secrets; QR real e leitura não comprovados; envio pela fila via QR não adaptado (exige campo de provedor no banco).
