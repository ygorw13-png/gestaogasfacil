> **IMPLANTADO — 12/11/2026: fluxo de entregas (candidato 012).** Aplicado no Cloud como `drizzle/migrations/0011_g1_012_fluxo_entregas.sql`
> (idêntico ao candidato). Registro, testes e os 8 registros antigos pendentes: `docs/IMPLANTACAO_G1_012.md`.
>
# GásFácil — Handoff para continuidade

> **IMPLANTADO — 11/11/2026 (~17h UTC): decisão B (reversão controlada, candidato 011).** Aplicado no banco do Cloud
> como `drizzle/migrations/0010_g1_011_reversao_controlada.sql` (idêntico ao candidato; 15 funções com o mesmo conteúdo do
> laboratório). Telas: botão "Reverter" no histórico/vendas, página "Reversões e Reembolsos", recolhimento na carga do
> entregador, resumo separado no painel. Devolução parcial, diferença de preço na troca e decisão 13 continuam fora.
> Registro, testes e limites: `docs/IMPLANTACAO_G1_011.md`.

> **IMPLANTADO — 11/11/2026 (14h UTC):** G0.1 001 + G1 002–010 aplicados no banco do Cloud; funções G0.1
> publicadas; frontend com ações controladas ligadas por padrão publicado em gestaogasfacil.lovable.app.
> Registro e verificações: `docs/IMPLANTACAO_G1_010.md`. Os avisos "nada aplicado/publicado" abaixo são históricos.

> **Estado atual — 11/11/2026:** integração essencial lote 4 + continuidade 009 no candidato 010.
> Proteções SQL 43/43; estoque/concorrência 14/14; frontend 71/71; TypeScript e build passaram.
> Nada aplicado no Cloud ou publicado. Detalhes: `docs/CONTINUIDADE_G1_010.md`.
> Não sobrepor o 005 do lote 4. Próximo bloqueio para uso: acesso ao projeto Lovable de edição,
> verificação do gateway hospedado e implantação coordenada. Melhorias secundárias adiadas.


> **Estado mais recente — continuação G1 009, 10/11/2026:** base completa 005–008 preservada;
> adicionado bloqueio de venda por abertura e saldo (candidato 009). SQL local **14/14**, regras frontend
> **64/64**, TypeScript e build aprovados. Suíte geral ainda tem falhas; detalhes e limites em
> `docs/CONTINUIDADE_G1_009.md`. Nada publicado nem aplicado em produção.
> PIX/cartão na conta da empresa e acerto diário configurável são decisões recuperadas; implementação
> ainda pendente, sem reclassificar histórico. As referências antigas abaixo a essas decisões como
> não respondidas ficam substituídas por este registro. Próximo trabalho: essas regras e validação isolada
> das telas; cancelamento B segue bloqueado, gateway hospedado segue não verificado.

Data do retrato: **10/11/2026** (UTC). Commit de referência do código: `7902aca` (G1 lote 3) + commit desta entrega.
Este arquivo é o **documento único de estado atual**. Onde outro documento divergir, vale este (ver "Documentos substituídos").

> **Atualização de 10/11/2026 (continuação fora do Lovable, branch `claude/continuidade-g1-integracao-telas`):**
> lotes 1–4 + fila offline + rotas diretas implementados; candidatos SQL **005–008** criados e testados só em PostgreSQL
> descartável. Nada publicado, nenhuma migração aplicada no banco real. Estado detalhado e testes: **`docs/CHECKLIST_UNICO.md`**;
> relatórios por lote: `docs/lotes/`; decisões que bloqueiam: `docs/DECISOES_PENDENTES.md`; implantação/migração: `docs/PLANO_IMPLANTACAO.md`;
> gravações diretas: `docs/MAPA_GRAVACOES_DIRETAS.md`. As seções abaixo foram ajustadas onde o estado mudou.

> **Exportar o código NÃO exporta o banco de dados, os usuários, os arquivos de storage, os segredos, o agendamento
> nem os drafts.** Esses recursos existem apenas no Lovable Cloud e estão listados na seção 7.

Nada foi publicado, nenhuma migração foi aplicada, nenhum draft foi aceito e nenhum registro foi alterado para preparar esta entrega.
As verificações citadas como "rodadas nesta entrega" usaram somente bancos PostgreSQL descartáveis em 127.0.0.1 com dados fictícios.

---

## 1. O que é o projeto

App web (PWA, pt-BR) de gestão de distribuidora de gás e água: portaria (venda de balcão e estoque diário), pedidos e entregas,
app do entregador, clientes, promissórias, caixa e fechamento, despesas/frota/comissões, revendedores/pontos, relatórios.

- Frontend: React 18 + Vite 5 + TypeScript 5 + Tailwind 3 + shadcn/ui, TanStack Query, PWA (vite-plugin-pwa), fila offline (IndexedDB).
- Backend: Lovable Cloud (Supabase gerenciado): PostgreSQL com RLS, Auth, funções Deno (`supabase/functions/`).
- **Uma única instância de backend atende o preview e o app publicado.** O preview do Lovable lê e grava no banco de produção.
- Papéis existentes: `admin`, `user` (operador), `entregador`. Não criar outros sem decisão do proprietário.

Estrela-guia (`.lovable/north-star/north-star.md`): os clientes recebem seu gás e cada venda é paga; métrica = vendas concluídas por dia.

---

## 2. Mapa do repositório

| Caminho | Conteúdo | Situação |
|---|---|---|
| `src/` | Frontend ativo | Preview = este código. Publicado: ver seção 3 |
| `src/lib/g1/acoes.ts` | Camada única das ações controladas G1 (chave `VITE_G1_ACOES`) | No código, **desligada** no preview/publicado |
| `src/lib/orderMetrics.ts` | Leitura de valores de pedido + `summarizePainel()` (painel de 5 quadros) | Ativo |
| `src/lib/offline/` | Fila offline (chave de idempotência no payload) | Ativo |
| `supabase/migrations/` | 30 migrações | **Todas as 30 aplicadas** no Cloud (última `20260909121723`) |
| `supabase/functions/` | 8 funções ativas | Implantadas automaticamente no Cloud (compartilhado com produção) |
| `supabase/config.toml` | Config gerada (só `verify_jwt=false` em `fechamento-portaria-automatico`) | Gerada pelo Lovable — não editar |
| `src/integrations/supabase/client.ts`, `types.ts` | Cliente e tipos gerados | Gerados pelo Lovable — não editar; `types.ts` NÃO contém as tabelas/RPCs candidatas |
| `g0.1/candidate/` | Candidato G0.1: sessão/perfil (frontend) + funções admin/perfil | **Candidato**, não publicado |
| `g0.1/sql/001_profile_verification.sql` | SQL de privilégios de perfil/papel | **Candidato**, não aplicado |
| `g0.1/tests/` | Testes G0.1 (vitest, deno, integração real, navegador) | Laboratório |
| `g1/candidate/sql/` | SQL G1 002, 003, 004 + contenções/rollbacks | **Candidatos**, não aplicados |
| `g1/tests/sql/` | Suítes SQL (integração, permissões, segurança, contenção) | Laboratório |
| `g1/tests/browser/` | Testes de navegador (lote 1/2 com backend simulado; lote 3 com backend real isolado) | Laboratório |
| `g1/*.md`, `g0.1/*.md` | Relatórios, checklist, decisões | Referência (ver seção 10) |
| `docs/auditoria_funcional_v1.md` | Auditoria funcional somente leitura (04/11) que originou o plano G1 | Referência |
| `AGENTS.md` | Regras de arquitetura vigentes | **Obrigatório ler** |
| `roadmap.md` | Lista de etapas do plano pós-auditoria | Atualizado |

---

## 3. Estado: publicado × preview × candidato × pendente

- QR opcional (Evolution API v2, sem Facebook): função `whatsapp-qr` e Configurações > WhatsApp > "Conectar por QR" publicadas; sem secrets `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` mostra "Servidor não configurado". Não envia nem usa a fila.

> **Atualização 16/11/2026:** candidatos 014–016 aplicados no Cloud (migrações 0013–0016). 016 = canal obrigatório do aviso
> (App + WhatsApp) e fila `whatsapp_envios`; funções `whatsapp-envio` e `whatsapp-admin` publicadas. Pendente: conectar o
> WhatsApp Business da empresa, aprovar o modelo e ativar o envio; "Só WhatsApp", Entregue/Lido e aceite pelo WhatsApp
> dependem de o app receber respostas (exige atualização da base do app).

### Publicado (produção, gestaogasfacil.lovable.app — visibilidade pública)
- **Banco:** esquema das 30 migrações de `supabase/migrations/` (43 tabelas públicas, 52 políticas RLS, 9 funções públicas:
  `current_profile_role, get_my_org, handle_new_user, has_role, orders_set_defaults, profiles_guard_privileged_fields,
  registrar_movimentacao_portaria, set_updated_at, set_user_role`). Conferido por consulta de leitura nesta entrega.
  As políticas operacionais continuam amplas (CRUD por empresa, sem papel); `get_my_org()` não verifica conta ativa.
- **Funções:** as 8 de `supabase/functions/` (`create-user`, `create_profile`, `enviar-whatsapp`, `fechamento-portaria-automatico`,
  `get_user_profile`, `lookup-cep`, `manage-user`, `send-push`) — versões atuais, não as candidatas.
- **Frontend publicado:** a versão exata publicada **não foi conferida**. O agente não publicou durante as etapas G0.1 e G1;
  portanto as mudanças de frontend da Etapa 1 e dos lotes G1 devem ser tratadas como **somente preview** até publicação revisada.

### Somente no preview (código em `src/`, não publicado)
- Etapa 1 (dados fictícios eliminados: indicadores reais, Excel real, cobradores reais, `??` em zeros configurados, fechamento parcial fiel,
  pedido confirmado só após gravação, erro ≠ zero) — `g1/RELATORIO_LOTE1.md`.
- Correções de 04/11 (preço não multiplicado por quantidade, estoque mínimo por produto etc.).
- Lote 3: telas ligadas às ações controladas **atrás de `VITE_G1_ACOES`** (desligada → as telas seguem o caminho antigo);
  painel com 5 quadros (vendas concluídas, recebido hoje, saldo a receber, saldo vencido, divergências) — com a chave desligada,
  "recebido" mostra "Não comprovado" porque o banco publicado não tem `recebimentos`.
- Atenção: o preview grava no **banco de produção**.

### Candidatos (no repositório, nunca aplicados/implantados)
| Item | Arquivos | Última validação |
|---|---|---|
| G0.1 perfil/sessão | `g0.1/candidate/src/**`, `create_profile`, `get_user_profile`, `001_profile_verification.sql` | 59/59 vitest (rodado nesta entrega); navegador isolado 14/14 (03/11) |
| G0.1 administração | `g0.1/candidate/supabase/functions/{create-user,manage-user,_shared/g01-admin*.ts}` | 68/68 deno (rodado nesta entrega); integração real isolada 21/21 (03/11) |
| G1 002 isolamento/inativos | `g1/candidate/sql/002_isolamento_inativos.sql` (+ `002_rollback.sql`, só laboratório) | segurança 26/27 (rodado nesta entrega; 1 diferença intencional) |
| G1 003 papéis/carga/a prazo | `003_permissoes_carga.sql` | permissões 69/69 com `G1_004=1` (rodado nesta entrega) |
| G1 004 integração das telas | `004_integracao_telas.sql`, `004_contencao.sql`, `004_contencao_desfazer.sql` | integração 40/40 (rodado nesta entrega); navegador real isolado 14/14 (10/11, não reexecutado) |
| `003_contencao.sql` | **substituído** por `004_contencao.sql` — usar só em laboratório | — |
| G1 005 tipo de venda + reenvio por conteúdo | `005_tipo_venda_idempotencia.sql` | `run_vendas005.py` 37/37 (10/11, PG16) |
| G1 006 saldo da portaria + data operacional Bahia | `006_saldo_portaria.sql` | `run_portaria006.py` 38/38 (10/11, PG16) |
| G1 007 carga (devolução, saldo, histórico, vasilhame na rua) | `007_carga_telas.sql` | `run_carga007.py` 31/31 (10/11, PG16) |
| G1 008 promissórias, destino do dinheiro, acerto | `008_recebimentos_acerto.sql` | `run_acerto008.py` 43/43 (10/11, PG16) |

Status único G0.1: **NÃO PRONTO PARA PRODUÇÃO** (gateway hospedado do Cloud não verificado).
Cadastro de colaborador pelo candidato: desligado (`G01_CREATE_BANNED_VALIDATED` ausente → `create-user` responde 503).

### Pendente
- Verificação pelo **gateway hospedado** do Lovable Cloud (os drafts validaram apenas a cópia local do gateway).
- **Aprovação explícita de produção** pelo proprietário (separada de qualquer aprovação de regra).
- Decisão **B** (efeito do cancelamento de venda concluída / estorno) e demais decisões da seção 4.
- ~~Saldo da portaria não é conferido na transferência portaria→carga~~: resolvido no candidato 006 (abertura e saldo obrigatórios).
- Recusa de cancelamento de venda concluída pelo admin foi verificada só por chamada direta (B12), não pela tela.
- 7 testes legados do template falham (seção 6) — não relacionados às mudanças G0.1/G1, não investigados.

### Sequência de produção (quando aprovada; não executar sem autorização)
G0.1: funções admin → `001_profile_verification.sql` → funções de perfil → frontend → testes de fumaça (`g0.1/PUBLICATION_SEQUENCE.md`).
G1: `002` → `003` → `004` → `005` → `006` → `007` → `008` → publicar frontend com `VITE_G1_ACOES=on` na mesma janela
(fora de 21:00–23:59 Bahia) → testes de fumaça (detalhe em `docs/PLANO_IMPLANTACAO.md`).
Contingência de produção: `004_contencao.sql` (mantém os bloqueios). **Nunca** `002_rollback.sql` nem `003_contencao.sql` em produção.

---

## 4. Decisões operacionais

### Aprovadas pelo proprietário (04/11/2026)
- **1. Estoque:** balcão consome a portaria; saída para entregador = transferência para carga identificada (não é venda);
  entrega concluída consome a carga; sobra volta da carga; nunca descontar duas vezes; cheios, vazios e emprestados separados.
- **11. Venda a prazo:** registrada na data da venda; pagamento posterior = recebimento de dívida (não nova venda);
  fiado não aumenta o caixa; recebimentos parciais preservam saldo e histórico.
- **15. Permissões:** admin = gestão completa só por ações controladas com motivo e histórico, sem exclusão definitiva de histórico;
  operador (`user`) = pedidos, caixa (abrir/receber/despesa/fechar), estoque operacional, clientes, leitura só das configurações necessárias;
  entregador = só entregas atribuídas a ele (vínculo **por ID**, nunca por nome), aceitar/iniciar/concluir, venda na rua, recebimento próprio,
  consumir/devolver a própria carga — tudo por funções controladas; cadastro rápido de cliente; sem edição livre.
  Cobradores para operador: lista com só ID, nome e situação. Contingência deve preservar os bloqueios.

### Encaminhamentos aplicados no lote 3 (10/11)
- **A.** Operador continua **sem** cancelar, alterar preço ou estornar (só admin, com motivo).
- **C.** Troca de entregador de pedido aberto: explícita, por ID, com motivo (`reatribuir_entrega`); históricos antigos não são vinculados.
- **D.** Origem física real: opção "O produto sai agora da portaria" na atribuição → transfere para a carga antes do consumo.
- Venda concluída não pode ser cancelada enquanto B estiver pendente; sem estorno automático.

### Ainda pendentes (não presumir)
- **B** — efeito do cancelamento de venda já concluída (estorno automático × lançado à parte) = decisão 5.
- 3 (pedido pendente reserva estoque?), 6 (venda em data passada — hoje recusada), 7 (destino do PIX e periodicidade do acerto),
  10 (fechamento/reabertura e acumulado dos parciais), 4, 8, 9, 12, 13, 14, 16 (método de custo), 17 (frete/impostos).
- Texto integral das 17 perguntas e opções: `g1/DECISOES_OPERACIONAIS.md`.

### Regras de produto mantidas (memória do projeto no Lovable — não acompanha a exportação, copiada aqui)
- App em português (pt-BR). Menu Financeiro agrupa Despesas, Frota e Comissões.
- Portaria zera todo dia (saldos por `data_operacao`); dias anteriores ficam em `movimentacoes_portaria`; a primeira abertura do dia
  mostra o diálogo de saldo inicial (OpeningBalanceDialog) pré-preenchido com o último fechamento — não remover.
- Toda venda tem `tipo_venda`: `completa` (sai casco), `recarga` (entra vazio), `vasilhame` (só casco). Campos `vasilhames_entregues/recebidos`.
  Dinheiro, PIX, crédito e débito exigem valor; promissória e convênio exigem cliente (só promissória gera `promissory_notes`).
- `orders.price` é o **total** da venda (não unitário).
- Comissões (`/comissoes`): nasce desativado (`comissao_config.ativo`); % sobre venda ou valor fixo por botijão; % por forma de pagamento;
  promissória só comissiona quando recebida; bônus por faixas sobre o recebido em promissórias; fechamento quinzenal (1–15, 16–fim).
- App do entregador: alerta sonoro na atribuição; lembretes a cada 2 min em rota >15 min; pendente sem aceite há ≥5 min alerta a cada 20 s;
  localização em `entregador_localizacoes` a cada 2 min; endereço vira link do Google Maps.
- G0.1: verificação de perfil exige `ativo IS TRUE`; perfil ausente não é recriado ativo; recuperação nunca concede administração;
  não usar usuários, pedidos, estoque ou finanças reais como fixtures.

---

## 5. Última tarefa, tarefa interrompida e próximo passo

**Atualizado em 10/11/2026 (branch `claude/continuidade-g1-integracao-telas`):**
- Concluído: Lote 1 (vendas), Lote 2 (saldo da portaria + data Bahia), Lote 3 (telas de carga), Lote 4 (promissórias, destino
  do dinheiro, acerto registrado), fila offline (dono do lançamento, recusa visível), rotas diretas que não gravavam.
- Próximo passo: (1) com o proprietário: decisões em `docs/DECISOES_PENDENTES.md` (PIX/acerto, cancelamento B, venda sem
  abertura) e aprovação; (2) técnico: instalar dependências e rodar `vitest`/`tsc`/`lint`/`build`; montar o laboratório de
  navegador (PostgREST + gateway + build) e exercitar as telas novas; itens "Revisar" do checklist.

Histórico (texto de 10/11 antes da continuação):

- **Última tarefa concluída:** G1 lote 3 (commit `7902aca`, 10/11) — telas ligadas às ações controladas atrás de `VITE_G1_ACOES`,
  painel com 5 quadros, SQL 004 + contenção revisada; relatório em `g1/RELATORIO_LOTE3.md`.
- **Tarefa interrompida:** nenhuma ficou pela metade no código. A interrupção anterior (checkpoint de manutenção `e420498`) foi retomada
  e concluída no próprio lote 3. O ambiente de laboratório do navegador (PostgREST, gateway, cópia do frontend em `/root` e `/tmp`)
  **se perdeu** com o reinício do sandbox; o gateway foi recuperado do pacote do lote 3 para `g1/tests/browser/gateway_isolado.ts`
  (idêntico byte a byte) e a configuração do PostgREST foi reconstruída em `pgrst.conf.example`.
- **Próximo passo exato:**
  1. Com o proprietário: decisão **B** e aprovação de produção; verificação no gateway hospedado do Cloud (pendência G0.1).
  2. Técnico, sem depender de nova decisão: candidato `g1/candidate/sql/005_saldo_portaria.sql` fazendo `_transferir_para_carga`
     recusar transferência acima do saldo de cheios da portaria no `data_operacao` corrente, com teste em `run_integracao.py`
     (falha sem saldo, nada gravado). Confirmar com o proprietário como tratar transferência antes da abertura do dia e o fuso
     (America/Bahia é a Etapa 8). Aplicar só no banco descartável.
  3. Em paralelo: Etapa 10 (limpezas registradas — `RouteReports` órfão, `mockData.ts` de promissórias sem uso, rota `/entrance/cashier`
     quebrada, avisos de configurações sem efeito) e corrigir/atualizar os 7 testes legados quebrados.

---

## 6. Executar e testar

### Versões observadas no ambiente de desenvolvimento
| Ferramenta | Versão |
|---|---|
| Node | 22.23.4 |
| Bun | 1.4.4 (há `bun.lockb` e `package-lock.json`) |
| Deno | 2.8.3 |
| PostgreSQL (laboratório) | 17.11 |
| Python | 3.13 + Playwright 1.59.0 (Chromium) |
| Vite / Vitest / TypeScript | 5.4.6 / 1.6.1 / 5.6.2 |
| React / supabase-js / TanStack Query | 18.3.1 / 2.106.2 / 5.56.2 |
| vite-plugin-pwa | 1.3.0 |
| Laboratório G0.1 | Supabase Auth v2.197.0 (release oficial), PostgREST (nixpkgs) |
| Laboratório G1 lote 3 | PostgREST 14.12 |

### App
```bash
bun install            # ou: npm ci
cp .env.example .env   # preencher; manter VITE_G1_ACOES=off contra o banco publicado
bun run dev            # http://localhost:8080
bun run build
bun run lint
```
Atenção: um `.env` apontando para o Cloud faz o app local **ler e gravar em produção**.

### Testes rodados nesta entrega (10/11/2026, 127.0.0.1, dados fictícios)
| Suíte | Comando | Resultado |
|---|---|---|
| Unitários G1 (regras + painel + fila offline) | `./node_modules/.bin/vitest run src/lib` | **25/25** |
| Testes legados de `src/` | `./node_modules/.bin/vitest run src` | 7 falhas legadas: `useSupabaseQuery` (2), `useSupabaseCRUD`, `Login.test`, `LoginForm.test`, `checkbox.test`, `UserList.test` (arquivos de 2025 / 08-2026, não tocados no G1). Com o config raiz, os testes de `g0.1/candidate/src` também são coletados e falham por resolução de imports — rode-os pelo config da G0.1 |
| G0.1 sessão/perfil/segurança | ver bloco abaixo | **59/59** (4 arquivos) |
| G0.1 administração | `deno test -A g0.1/tests/admin.test.ts g0.1/tests/admin-failure.test.ts` | **68/68** |
| G1 integração 004 | `G1DB=/tmp/g1db bash g1/tests/sql/reset_com004.sh && python3 g1/tests/sql/run_integracao.py "$U" rotulo` | **40/40** |
| G1 permissões 003+004 | (banco recriado) `G1_004=1 python3 g1/tests/sql/run_permissoes.py "$U" rotulo` | **69/69** (sem `G1_004=1`: 68/69, regra antiga) |
| G1 segurança 002 | (banco recriado) `python3 g1/tests/sql/run_security.py "$U" rotulo` | **26/27** — falha intencional: entregador só lê as próprias entregas |

`U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"`. Cada suíte SQL grava dados: **recrie o banco antes de cada uma**.
Os scripts recusam URL fora de 127.0.0.1 e usam `setpriv` para rodar o PostgreSQL como uid 1000 (ajuste se seu usuário não for root).

G0.1 vitest:
```bash
unset PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE
initdb -D /tmp/g0-test/pgdata -A trust -U g0test
pg_ctl -D /tmp/g0-test/pgdata -l /tmp/g0-test/postgres.log -o '-p 55439 -h 127.0.0.1' start
psql 'postgresql://g0test@127.0.0.1:55439/postgres?sslmode=disable' -X -v ON_ERROR_STOP=1 -f g0.1/tests/bootstrap.sql -f g0.1/sql/001_profile_verification.sql
./node_modules/.bin/vitest run --config g0.1/tests/vitest.config.ts   # admin*.test.ts são Deno: rode com deno test
```

### Não reexecutados nesta entrega (exigem infraestrutura de laboratório a remontar)
- G0.1 integração real 21/21 (`g0.1/tests/integration/live.test.ts`) e navegador 14/14 (`g0.1/tests/browser/g01_browser.py`): passos em `g0.1/REPRODUCE.md`.
- G1 navegador lote 3 14/14 (`g1/tests/browser/run_lote3.sh`). Remontar:
  1. PostgREST (`nix build nixpkgs#postgrest` ou binário 14.x) em `/root/pgrst-bin/bin/postgrest`;
  2. `/root/iso/secret` (segredo local) e `/root/iso/pgrst.conf` a partir de `g1/tests/browser/pgrst.conf.example`;
  3. `deno run -A g1/tests/browser/gateway_isolado.ts` (127.0.0.1:58000);
  4. cópia do frontend fora do projeto com `.env` → `VITE_SUPABASE_URL=http://127.0.0.1:58000`, chave publicável qualquer assinada com o segredo local,
     `VITE_G1_ACOES=on`, `vite build` e `python3 g1/tests/browser/spa_server.py` (127.0.0.1:8091). A cópia isolada desativa o redirecionamento HTTPS
     e restringe conexões a 127.0.0.1 (ver `g0.1/tests/browser/isolated-only-csp.diff`); realtime fica desligado.
  5. `bash g1/tests/browser/run_lote3.sh`.
- Testes de navegador dos lotes 1/2 (`harness.py`, `validate.py`) interceptam todas as requisições ao host do projeto (o identificador do projeto aparece
  no arquivo apenas para a interceptação) e esperam o app em `localhost:8080`.

---

## 7. Recursos que existem só no Lovable Cloud ou em drafts (NÃO acompanham a exportação)

| Recurso | Situação conferida (leitura, 10/11) | Observação |
|---|---|---|
| **Dados do banco** (pedidos, clientes, promissórias, estoque, caixa…) | Banco de produção | Não exportados. Reconstruir esquema pelas 30 migrações; dados só por exportação própria autorizada |
| **Usuários de Auth** | 2 contas | Não exportadas; senhas nunca exportáveis. Configuração de login (provedores, confirmação de e-mail) também fica no Cloud — não conferida nesta entrega |
| **Storage** | 0 buckets, 0 arquivos | Nada a exportar hoje |
| **Agendamento** `fechamento-portaria-diario` | `pg_cron`, `5 3 * * *` (UTC = 00:05 em Bahia), ativo | **Não está nas migrações.** Recriar manualmente se mudar de backend |
| Extensões | `pg_cron`, `pg_net`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault` | `pg_cron`/`pg_net` não estão nas migrações |
| Realtime | publicação `supabase_realtime` com `orders` | Está na migração `20260527165458` |
| **Segredos das funções** | nomes: `LOVABLE_API_KEY` (gerenciado), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Valores não exportáveis. `SUPABASE_*` são fornecidos pela plataforma. Variáveis de WhatsApp (`EVOLUTION_*`, `WHATSAPP_*`, `TWILIO_*`) **não configuradas** |
| Vault | nenhum segredo | — |
| Funções implantadas | 8 funções atuais | O código está no repositório; a implantação é do Cloud |
| Publicação / domínio | gestaogasfacil.lovable.app, pública, sem domínio próprio | Configuração do Lovable |
| **Draft "G0.1 validação isolada"** (`drft_01m6h1bx…`) | pronto, atrás do principal, banco de teste próprio | **Não aceitar** — aplicaria migração dele |
| **Draft "G0.1 gateway gerenciado"** (`drft_01m6hkx5…`) | pronto, atrás do principal, banco de teste próprio | **Não aceitar**; validou só a cópia local do gateway |
| Memória do projeto no Lovable | regras de produto e restrições | Copiadas na seção 4 |
| Arquivos em "Files" do Lovable | relatórios e pacotes anteriores | Ver seção 10; não fazem parte do repositório |

---

## 8. Regras de arquitetura (resumo — texto completo em `AGENTS.md`)
- Candidatos G0.1 em `g0.1/candidate/`, G1 SQL em `g1/candidate/sql/`, fora de `src/`/`supabase/`, porque o backend é compartilhado com produção
  e funções em `supabase/functions/` são implantadas automaticamente pelo Lovable. Não promover sem aprovação de produção.
- Testes só com fixtures fictícias e PostgreSQL descartável em loopback; nunca o cliente de produção nem registros operacionais.
- Ações controladas = RPCs `SECURITY DEFINER` com chave de idempotência e trava de linha; gravação direta bloqueada por gatilhos
  salvo `g1.acao_controlada` definido dentro da RPC.
- Telas chamam ações G1 só via `src/lib/g1/acoes.ts`, atrás de `VITE_G1_ACOES=on`; ações na fila offline levam a chave no payload.
- Leituras de valor de pedido via `src/lib/orderMetrics.ts` (`orders.price` = total).
- Contingência de produção = arquivo de contenção que mantém os bloqueios; rollbacks são só de laboratório.
- Se o projeto continuar também no Lovable: não editar `src/integrations/supabase/client.ts`, `types.ts`, `.env`, `supabase/config.toml`.

---

## 9. Segurança e conteúdo desta entrega
- **Excluídos do pacote:** `.env` (valores do projeto), `node_modules`, `dist`, metadados Git, caches (`__pycache__`, `.oj-cache`, `.workspace`),
  e `fechamento-portaria-2026-08-11.pdf` (relatório operacional real de 11/08 — **continua no repositório Git**; avalie removê-lo de lá).
- **Removido do projeto:** `src/integrations/supabase/supabase-client.ts` — arquivo legado sem uso que apontava para outro backend antigo
  com uma chave publicável embutida.
- Nenhuma senha real, token, service-role key ou dado pessoal foi incluído. Restam apenas valores **fictícios de laboratório**:
  e-mails `@ficticio.test`, `@example.invalid`, `@example.com`; senhas de fixtures (ex.: `senha-ficticia-123` do stub local de login,
  senhas de teste nos mocks da G0.1); CPFs/telefones de exemplo em dados de demonstração. Nenhum vale para sistema real.
- O repositório Git (fora deste pacote) contém `.env` com URL, ID do projeto e **chave publicável** (pública por natureza, gerada pelo Lovable).
- `SHA256SUMS.txt` no pacote lista o hash de cada arquivo.

---

## 10. Documentos substituídos
| Documento antigo | Substituído por |
|---|---|
| `README.md` (modelo do Lovable, com URL de outro projeto) | novo `README.md` curto → este arquivo |
| `.env.local.example` (nomes errados, ex. `VITE_SUPABASE_ANON_KEY`) | `.env.example` (removido o antigo) |
| Seção "Estado publicado vs candidatos" de `g1/CHECKLIST.md` | seção 3 deste arquivo (o restante do checklist segue válido) |
| "Lote atual"/"Pendências externas" de `roadmap.md` | seção 5 deste arquivo |
| `g1/candidate/sql/003_contencao.sql` como contingência | `004_contencao.sql` (o 003 fica só para laboratório) |
| Checklist de estado (`g1/CHECKLIST.md`, seção 3 deste arquivo para detalhes de teste) | `docs/CHECKLIST_UNICO.md` (implementado / testado / pendente / publicado) |
| `.lovable/plan.md` (plano antigo do CRM de Recompra) | histórico; não reflete o plano atual |
| Em Files: `gasfacil_dossie_completo.md` e `-1.md` (03/11), `gasfacil_diagnostico_tecnico_operacional.pdf` (03/11) | `docs/auditoria_funcional_v1.md` + este arquivo |
| Em Files: `gasfacil_g0_1_isolated_validation.md`, ZIPs `gasfacil_g0_1_*` (admin v1/v2, revisao, revisao_v2, consolidado v3/v4, validacao_v1) | `g0.1/` deste pacote (inclui README, INTEGRATION_RESULTS, BROWSER_RESULTS, PUBLICATION_SEQUENCE) |
| Em Files: `gasfacil_g1_CHECKLIST.md`, `gasfacil_g1_DECISOES_OPERACIONAIS.md` e `_v3.md`, `gasfacil_g1_relatorio_lote1/2.md`, `gasfacil_g1_lote3_relatorio.md`, ZIPs `gasfacil_g1_seguranca_candidato_v1`, `gasfacil_g1_lote2_v1`, `gasfacil_g1_lote3` | `g1/` deste pacote (versões atuais dos mesmos documentos) |
| Seções históricas abaixo do topo em `g0.1/README.md` | o topo do `g0.1/README.md` e este arquivo |


## Atualização 12/11/2026 — candidato 013 publicado
Fechamento total bloqueia qualquer entrega aberta com data ≤ dia do fechamento (sem limite). Cloud: `drizzle/migrations/0012_g1_013_bloqueio_fechamento_sem_limite.sql`. Testes: `reset_com013.sh com_abertura` + `run_bloqueio013.py` 17/17; entregas 72/72; segurança 27/27. Os 8 registros antigos sem regularização bloqueiam o fechamento total até decisão do proprietário.

## Atualização 16/11/2026 — correção de sessão publicada
Sair ou perder a sessão num aparelho não derruba os outros (`signOut({ scope: 'local' })`). Sem sessão local o app não chama `get_user_profile` nem `create_profile`; chamadas simultâneas compartilham a verificação; falha de rede não encerra a sessão (offline preservado). Testes: `userProfile.test.ts` 7/7, `AuthContext.test.tsx` 6/6. Browser: sessão revogada fictícia vai direto ao login sem chamar a função. Publicado em gestaogasfacil.lovable.app; o pacote publicado contém o marcador `AuthSessionMissingError` (commit 74c30a8). Teste antigo de `g0.1/candidate/src/contexts/AuthContext.test.tsx` continua falhando por import ausente (fora do sistema em uso).

## Atualização 16/11/2026 — candidato 014 publicado
Formas de pagamento com código próprio (`src/lib/formasPagamento.ts` ↔ `public._forma_pedido`); vale-gás/Gás do Povo/convênio aceitam valor não informado (NULL, sem recebimento/promissória). Cloud: `drizzle/migrations/0013_g1_014_formas_pagamento.sql`. Aviso do entregador: `send-push` (tipos `atribuicao`/`teste`, destinatário lido do banco), `public/push-sw.js` com escopo `/push/`. Testes: `reset_com014.sh com_abertura` + `run_formas014.py` 38/38; segurança 27/27; navegador `g1_014_browser.py` 20/20 e `g1_014_avisos_browser.py` 7/7 (`lab_reset.sh com014`); `g1/tests/push/run_push014.py` 11/11. Android real não conferido.

## Atualização 16/11/2026 — candidato 015 publicado
Correção da forma de pagamento de venda concluída: `public.admin_corrigir_forma_pagamento(order, forma, motivo, chave)` (Cloud `0014_g1_015_corrigir_forma_pagamento.sql`, candidato `g1/candidate/sql/015_corrigir_forma_pagamento.sql`). Auditoria em `auditoria_correcoes` (venda e título). Testes: `reset_com015.sh com_abertura` + `run_forma015.py` 23/23. Tela: `useEditarVenda` (G1) chama a ação quando só a forma muda.

## Atualização 16/11/2026 — agregados (candidato 017)
Publicado/aplicado: retirada de agregado sem preço, preço sigiloso, por conta e acerto do administrador (`g1/candidate/sql/017_agregados.sql` = `drizzle/migrations/0017_g1_017_agregados.sql`). Testes: `g1/tests/sql/reset_com017.sh com_abertura` + `run_agregado017.py` (51/51). Decisões abertas no `docs/CHECKLIST_UNICO.md`.

## Atualização 16/11/2026 — Aplicativo do PC (candidato 018/018c)
Endpoint `https://dufsbwslvnucptjwvtvd.supabase.co/functions/v1/whatsapp-desktop` (protocolo 1). Banco: `g1/candidate/sql/018_whatsapp_desktop.sql` (= drizzle 0018+0019+0020; `018c_recuperacao_journal.sql` é o recorte da 0020). Testes: `reset_com018.sh com_abertura` + `run_desktop018.py` (61/61). Envio do PC desligado; nenhum dispositivo pareado em produção.

## Atualização 16/11/2026 — aviso mínimo (candidato 019, NÃO aplicado/publicado)
`g1/candidate/sql/019_aviso_link.sql` troca só o corpo de `_wd_texto` (aviso do Aplicativo do PC: número + link). Testes: `reset_com019.sh com_abertura` + `run_aviso019.py` (15/15) + `run_desktop018.py` (61/61). Telas: `src/utils/destinoLogin.ts`, Login, useLoginForm, MinhasEntregas. Aguardando conferência do diff para aplicar no Cloud e publicar.
