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
