# Auditoria Funcional Completa — GásFácil

**Data:** 04/11/2026 · **Tipo:** somente leitura (código + consultas de leitura ao banco) · **Escopo:** estado publicado; candidatos G0.1 tratados separadamente.

**Classificação de evidências usada neste relatório:**
- **[CÓDIGO]** — confirmado por leitura de código ou estrutura do banco (arquivo:linha).
- **[DADOS]** — observado em consultas de leitura ao banco.
- **[SUSPEITA]** — indício que exige teste para confirmar.
- **[DECISÃO]** — regra operacional que precisa ser definida pelo proprietário.

Nada foi alterado, publicado ou testado em produção. Nenhum draft foi aceito.

---

## A. Resumo executivo

### Problemas mais relevantes

1. **CRÍTICO — O banco não impõe as restrições que as telas sugerem.** Quase todas as tabelas operacionais e financeiras (pedidos, caixa, promissórias, despesas, comissões, frota, estoque) aceitam leitura, escrita, alteração e exclusão de **qualquer usuário autenticado da empresa**, inclusive entregador. A restrição existe só na navegação. [CÓDIGO — seção 6]
2. **CRÍTICO — Recebimento parcial quita a promissória inteira.** Qualquer valor recebido marca o título como pago, sem saldo residual nem histórico de parcelas. [CÓDIGO]
3. **CRÍTICO — Vendas a prazo sem título.** 46 dos 57 pedidos pagos em promissória não têm nota vinculada; o vínculo existente é um texto em `notes`, sem chave estrangeira. [DADOS + CÓDIGO]
4. **CRÍTICO — Baixa física de estoque ausente em três dos quatro caminhos de venda.** Pedidos com entrega, vendas na rua e saídas de rota não baixam estoque; o cancelamento pode creditar estoque que nunca foi debitado, e cancelamentos repetidos estornam de novo. [CÓDIGO]
5. **ALTO — Dois status terminais incompatíveis.** O entregador grava `completed`; a portaria só soma `delivered`. Vendas da rua não entram no total do caixa, e o acerto do entregador só vê `completed`. [CÓDIGO + DADOS: 123 `delivered` vs 1 `completed` na base]
6. **ALTO — Comissões não reconhecem os códigos de pagamento que a portaria grava.** `money`, `credit` e `debit` caem em "outros" com percentual zero; só PIX é reconhecido corretamente. [CÓDIGO]
7. **ALTO — Relatórios e indicadores inventados.** O Excel gerencial usa números aleatórios e margem fictícia de 55%; o painel administrativo mostra valores fixos (faturamento R$ 42.580, lucro R$ 42.580, 24 usuários, conversão 87%). [CÓDIGO]
8. **ALTO — Fechamento de caixa duplicado e sem unicidade.** Dois fechamentos "total" idênticos em 10/08/2026; o esquema permite vários por dia e a consulta usa `maybeSingle`. [DADOS + CÓDIGO]
9. **ALTO — Cinco das seis telas de configuração não têm efeito operacional.** Entrega, financeiro, notificações, segurança e sistema salvam dados que nenhuma lógica consome; o tempo de sessão é fixo em 30 minutos independente do configurado. [CÓDIGO]
10. **MÉDIO — Dados operacionais inconsistentes.** Saldo de vasilhames emprestados negativo (-2), 9 registros órfãos em contas de parceiros, 120 entregas sem entregador registrado, 126 de 143 pedidos sem `client_id`. [DADOS]
11. **MÉDIO — Fuso horário não garantido.** Consultas usam meia-noite do navegador e chaves UTC; divergências diárias entre pedidos e movimentações são compatíveis com o limite de dia UTC vs America/Bahia. [SUSPEITA — requer teste]
12. **MÉDIO — Fila offline sem isolamento por usuário.** Pendências são reenviadas com a sessão vigente, não com a do autor; sincronização em segundo plano não está implementada no service worker. [CÓDIGO]

### Módulos sem nenhum registro real na base [DADOS]

Rotas, acertos de entregador, cascos emprestados (cadastro individual), trocas de cheque, tarefas mensais, conferências diárias, requisições de estoque, contatos de recompra, templates de mensagem, mensagens WhatsApp, veículos/frota, comissões (configuração, regras e fechamentos) e `dashboard_data` estão **vazios**. Isso não significa que estejam quebrados — significa que nunca foram usados de verdade, e vários contêm problemas que só apareceriam em uso.

Período das vendas: 06/08/2026 a 09/09/2026 (sem vendas há ~2 meses). 2 organizações e 2 perfis na base; todos os 143 pedidos pertencem a uma única organização.

---

## B. Inventário funcional

### B.1 Rotas (35 + raiz + curinga)

Todas as rotas protegidas usam `AuthGuard` + `RoleGuard` (`src/App.tsx:103-104`). O `RoleGuard` **só restringe entregador** (4 rotas permitidas); qualquer outro papel autenticado acessa todas as telas, inclusive configurações, financeiro e colaboradores (`src/components/auth/RoleGuard.tsx:5-30`).

| Módulo | Rotas | Estado |
|---|---|---|
| Autenticação | `/login`, `/register`, `/reset-password` | Conectado |
| Painel/Dashboard | `/dashboard`, `/painel` | Conectado, mas com indicadores fictícios (seção E) |
| Clientes | `/clients` | Conectado |
| Pedidos | `/orders`, `/orders/map` | Conectado |
| Pedidos (rotas quebradas) | `/orders/new` (callback vazio), `/orders/:id` (sempre fechado, sem ID) | **Parcial — composta com props vazias** (`src/App.tsx:125-132`) |
| Portaria | `/entrance`, `/entrance/history`, `/entrance/acerto-entregadores`, `/entrance/historico-portaria` | Conectado |
| Portaria (rotas quebradas) | `/entrance/new-sale`, `/entrance/cashier` (diálogos montados fechados, callbacks vazios) | **Parcial** (`src/App.tsx:140-153`) |
| Estoque | `/inventory` | Conectado, com componentes legados misturados |
| Promissórias | `/promissory` | Conectado |
| Rotas de entrega | `/routes` | Conectado; botão "Verificar Retorno" sem ação |
| Revendedores/Pontos | `/resellers`, `/pontos-revenda` | Conectado |
| Financeiro | `/finance/expenses`, `/finance/cheques`, `/comissoes` | Conectado |
| Frota | `/fleet` | Conectado (sem dados reais na base) |
| Colaboradores | `/colaboradores` | Conectado |
| Entregador | `/entregador/entregas`, `/entregador/venda-rua`, `/entregador/cadastro`, `/entregador/perfil` | Conectado |
| Relatórios | `/relatorios/vasilhames` | Conectado (consulta real) |
| Utilitários | `/formularios`, `/offline`, `/recompra` | Conectado |
| Desenvolvimento | `/dev/responsive` | **Exposta em produção, sem link de menu** |
| Configurações | `/settings` (8 abas) | Persistência real; 5 abas sem efeito operacional |

### B.2 Edge functions (8)

| Função | Chamador no frontend | Estado |
|---|---|---|
| `create-user` | Configurações → Usuários | Conectado |
| `manage-user` | Configurações → Usuários | Conectado |
| `create_profile` | Cadastro | Conectado; **define `role='admin'` no fallback** |
| `get_user_profile` | Serviço de sessão | Conectado; tem caminho de recriação de perfil |
| `enviar-whatsapp` | Hook de envio | Conectado; depende de variáveis de provedor |
| `lookup-cep` | Cadastro de cliente | Conectado |
| `fechamento-portaria-automatico` | **Nenhum chamador encontrado** | Sem uso; não há `pg_cron` nas 30 migrations [SUSPEITA: pode haver agendamento externo — verificar] |
| `send-push` | **Nenhum chamador encontrado** | Inscrição existe; disparo não comprovado |

### B.3 Componentes órfãos (sem referência estática encontrada)

`RouteReports` (relatórios de rota demonstrativos), `StockManagement`, `StockOverview`, `ResellersSalesHistory`, `CorrigirEstoqueGeralDialog`, `InventoryItemTable`, `InventoryTabs`, `DateAndPaymentMethod`, `ClosingHistoryTable`, `CashierClosingSummary`, `FireAnimation`, `GasCylinderIcon`. Classificação por ausência de referência estática; remoção exige validar reexports.

### B.4 Agendamentos

Nenhum `pg_cron`/`pg_net` nas migrations. Frontend tem polling de 15s a 5min para localização, pedidos, vendas, dashboard e fila offline. O lembrete de fechamento verifica a cada 60s mas **não fecha automaticamente**.

---

## C. Matriz de integração e fontes de verdade

### C.1 Operação → origem → registros → divergência

| Operação | Onde grava | Baixa de estoque | Divergência |
|---|---|---|---|
| Venda na portaria | `orders` (delivered) + `movimentacoes_portaria` + `conta_botijoes` (parceiros) + `promissory_notes` (se a prazo) | Sim, em chamada paralela | **Sem transação**: insert de `orders` não tem erro verificado; pode haver movimento sem venda ou venda sem movimento. `referencia_id` não é o ID do pedido [CÓDIGO `useCashierSales.tsx:152-248`] |
| Venda rápida | `orders` (delivered) + movimento com `referencia_id` real | Sim, após salvar | Falha de estoque deixa venda salva pedindo ajuste manual [CÓDIGO `QuickSaleDialog.tsx:141-161`] |
| Pedido com entrega | `orders` (pending → assigned → delivering → completed/delivered) | **Não encontrada em nenhuma etapa** | Estoque nunca baixado nesse caminho [CÓDIGO] |
| Venda na rua | `orders` (completed) + `promissory_notes` (se a prazo), via fila offline | **Não encontrada** | Status `completed` não entra no total da portaria; sem vínculo com rota/carga [CÓDIGO] |
| Atribuição/aceite/recusa/conclusão | `orders` | — | Updates filtram só por ID, sem verificar status anterior; recusa não limpa timestamps; sobrescrita concorrente possível [CÓDIGO] |
| Edição de venda | `orders` + ajustes de estoque + conta parceiro | Ajuste por diferença | Não edita cliente/modalidade; não atualiza promissória; classifica comodato por `has_empty_cylinder` (atinge venda completa); troca de produto sem mudar quantidade não ajusta ficha do parceiro [CÓDIGO `useEditarVenda.ts`] |
| Cancelamento de venda | `orders` (cancelled) + estorno de estoque | Estorna | **Não verifica se já estava cancelada** (estorno repetido possível); pode creditar estoque nunca debitado (venda de rua/entrega); não cancela a promissória vinculada [CÓDIGO `useCancelarVenda.ts`] |
| Saída de carga (rota) | `rotas` + `rota_pontos` + `conta_botijoes` | **Não encontrada** | `motorista_id` gravado como null; sem reconciliação carga × venda × retorno; "Verificar Retorno" sem handler [CÓDIGO `NewRouteForm.tsx:42-103`] |
| Acerto de entregador | Tela agrega `orders`; **não persiste em `acertos_entregador`** | — | Classificador de pagamento não reconhece `money`/`credit`/`debit`; colunas zeram [CÓDIGO `AcertoEntregadores.tsx:18-65`] |
| Recarga com troca | `orders` + movimento (cheio −qtd, vazio +qtd) | Sim (portaria) | `vasilhames_entregues` quase sempre 0 — campo sem uso real; `recebidos` carrega a informação [DADOS: 123 de 125 com entregues=0] |
| Venda de casco | `orders` + movimento (vazio −qtd) | Sim | **Produto fixado em P13** na portaria/edição/cancelamento, independente do selecionado; venda rápida usa o produto certo — caminhos não uniformes [CÓDIGO] |
| Empréstimo/comodato | Dois controles **independentes**: movimento `venda_comodato` (saldo) e `cascos_emprestados` (nominal) | Parcial | Os dois não se sincronizam: devolução pelo estoque não baixa o registro nominal e vice-versa [CÓDIGO + DADOS: saldo emprestados −2] |
| Venda a prazo | `orders` + `promissory_notes` | — | 46/57 pedidos sem nota [DADOS]; vínculo é texto `[venda:id]` em `notes` com checagem LIKE não atômica [CÓDIGO `promissory.ts:25-54`] |
| Recebimento de promissória | `promissory_notes` | — | **Qualquer valor quita o título**; sem parcelas, sem saldo residual, sem lançamento de caixa [CÓDIGO `usePromissoryNotes.ts:111-128`] |
| Despesa (caixa portaria) | `despesas` + movimento `sangria_despesa` + update de `valor_dinheiro` | — | Três gravações separadas sem transação; update de valor não verificado [CÓDIGO `useDespesas.ts:69-114`] |
| Fechamento de caixa | `fechamentos_caixa` (snapshot) + movimentos de deltas zero | Não ajusta estoque | Totais monetários do dia atual não são preenchidos a partir das vendas (ficam zerados); retroativo reconstrói; sem unicidade por dia — duplicado em 10/08 [CÓDIGO + DADOS] |
| Comissão | `comissao_fechamentos` (snapshot) | — | Códigos de pagamento incompatíveis (seção A.6); base em `created_at`, não entrega; regra por nome, não ID; cache por quantidade de regras [CÓDIGO `useComissoes.ts`] |
| Troca de cheque | `trocas_cheque` | — | Só histórico; sem movimentação de caixa/banco [CÓDIGO] |
| Offline (venda na rua) | Fila IndexedDB → `orders` + `promissory_notes` | — | Pedido e promissória são operações independentes (um pode sincronizar e outro falhar); fila sem isolamento por usuário [CÓDIGO] |

### C.2 Fontes de verdade e cópias paralelas

| Informação | Fonte operacional | Cópias/divergências |
|---|---|---|
| Estoque portaria (cheios/vazios/emprestados) | `movimentacoes_portaria` → view `saldo_portaria_atual` | Fechamento conta mas não ajusta; esperado do fechamento desconsidera transferências do pátio |
| Estoque pátio | Mesmas movimentações → `saldo_patio` | Agregação histórica, diferente da portaria diária |
| Estoque consolidado | `useEstoqueGeral` (pátio + portaria) | `dashboard_data.stock_data` legado ainda lido por hooks antigos, com padrão fictício quando vazio |
| Valor vendido | `orders.price` | **Três interpretações**: portaria usa `delivered` por `delivered_at`; comissões usam `delivered`+`completed` por `created_at`; dashboard usa tudo exceto `cancelled` por `created_at` |
| Recebido de promissórias | `paid_amount`/`paid_at` | Sem parcelas; valor zero vira null e comissão assume nominal integral |
| A receber | Títulos não pagos | Gestão exclui "avulso" e revendedores; dashboard não — números diferentes nas duas telas |
| Saldo de caixa | **Não existe fonte única conciliada** | Fechamento não desconta sangrias nem soma recebimentos de títulos |
| Lucro/margem | **Não disponível** — não há custo de mercadoria registrado | Relatório gerencial simula custo 45% e margem 55% |
| Comissões pagas | `comissao_fechamentos` | Snapshot sem compensação de cancelamentos posteriores |

### C.3 Datas e fuso

Consultas usam meia-noite do navegador, `toISOString()` (UTC) e chaves `slice(0,10)`; comissões montam timestamps sem offset. **Não há garantia de America/Bahia.** [SUSPEITA] A divergência diária observada entre pedidos e movimentações (11/08: 46 pedidos vs 39 movimentos; 10/08: 21 vs 30) é compatível com corte de dia em UTC — mas os totais batem (124 = 124), então pode ser apenas atribuição de data. **Teste necessário:** criar venda entre 21h e 23h59 (Bahia) e verificar em que dia cada consulta a registra.

---

## D. Divergências e reconciliação dos registros (somente leitura)

Contagens gerais [DADOS]: 143 pedidos · 204 movimentações de portaria · 54 promissórias · 45 contas de parceiros · 3 despesas · 4 fechamentos · 11 clientes · 4 revendedores.

| # | Achado | Evidência | Classificação |
|---|---|---|---|
| D1 | 46 dos 57 pedidos `delivered` pagos em promissória sem nota correspondente (por `client_id`) | Consulta de leitura | [DADOS] — parcialmente explicado por criação manual de notas, mas o vínculo não é confiável |
| D2 | Todas as 54 notas estão `pending` e vencidas (venc. máx. 09/10/2026); `paid_amount` sempre nulo | Consulta de leitura | [DADOS] — compatível com "nunca se recebeu pela tela" ou com quitações não registradas |
| D3 | Dois fechamentos `total` idênticos em 10/08/2026 (R$ 2.049, retroativos) | Consulta de leitura | [DADOS] — duplicidade permitida pelo esquema |
| D4 | Saldo de emprestados P13 = **−2** (negativo) | Soma de `movimentacoes_portaria` | [DADOS] — devoluções registradas sem empréstimo correspondente no saldo |
| D5 | 9 registros em `conta_botijoes` com `parceiro_id` inexistente em `clients`/`resellers` | Consulta de leitura | [DADOS] — órfãos (parceiro excluído ou vínculo quebrado) |
| D6 | `conta_botijoes.valor_total` sempre nulo (45 registros) | Consulta de leitura | [DADOS] — entregas a agregados/pontos sem valor financeiro registrado |
| D7 | 120 de 124 entregas sem `delivery_person`; 126 de 143 pedidos sem `client_id` | Consulta de leitura | [DADOS] — vendas de balcão não identificam cliente na tabela |
| D8 | Divergência diária pedidos × movimentações com totais iguais | Consulta de leitura | [SUSPEITA] — provável efeito de fuso (seção C.3) |
| D9 | Estoque: P13 114 cheios / 175 vazios; água 168/87; P20 e P45 zerados; produto "dinheiro" com −60 | Soma de movimentações | [DADOS] — sangrias usam produto "dinheiro"; saldos não conferíveis sem contagem física |
| D10 | 3 recargas entregues sem vazio recebido | Consulta de leitura | [DADOS] — pode ser comodato não registrado [DECISÃO: definir tratamento] |

**Não reconciliável com segurança:** pedidos × movimentações em nível de registro (a portaria não grava o ID do pedido em `referencia_id`); pedidos × promissórias (vínculo textual); contas de parceiros × pedidos (sem `order_id` preenchido). Nenhum saldo foi ajustado e nenhum registro foi apagado.

---

## E. Dados demonstrativos e resultados enganosos

| # | Onde | O que mostra | Ação recomendada |
|---|---|---|---|
| E1 | Dashboard → abas administrativas (`OverviewStats.tsx:10-40`, `FinanceMetrics.tsx:17-26`, `UsersOverview.tsx:9-33`) | Faturamento R$ 42.580, lucro R$ 42.580, receita R$ 158.450, conversão 87%, 24 usuários — **todos literais fixos** | Substituir por agregações reais; até lá, remover ou rotular "DEMONSTRAÇÃO" |
| E2 | Exportação Excel do dashboard (`reportDataGenerator.ts:10-51`) | Vendas diárias aleatórias (800–2.500), produtos inventados, custo 45%, margem 55%, recomendações fictícias; botão anuncia "Relatório gerado com sucesso" | Desabilitar ou marcar ostensivamente como demonstração |
| E3 | Relatórios de rotas (`mockRouteReports.ts`) | 3 rotas fictícias de abril/2025 com valores inventados; componente órfão (sem rota ativa) | Remover |
| E4 | Cobradores de promissórias (`mockData.ts:106-112`) | 5 nomes fixos (Carlos, Lucas, Marcos, Rafael, Eduardo) usados na atribuição de cobrança | Substituir por colaboradores reais |
| E5 | Configuração do sistema (`SystemConfiguration.tsx:17-22`) | Formulário vem preenchido com "GásFácil", "Av. Principal, 123", "(11) 99999-9999" | Iniciar vazio |
| E6 | Fechamento parcial (`useCashierClosing.ts:38-66`) | Divide vendas e quantidades por dois ("Exemplo simplificado") | Eliminar divisão arbitrária |
| E7 | Dashboard (`useDashboardData.ts:48-93`) | Erros de consulta viram zero (`.data \|\| []`, `?? 0`) — indisponibilidade parece "sem vendas/estoque zerado" | Verificar `error` e distinguir falha de ausência |
| E8 | Estoque mínimo e configurações | `estoque_minimo \|\| 20`: zero configurado vira 20; taxa de entrega 0 vira 5,00; imposto 0 vira 18% | Usar `??` e diferenciar "não configurado" |
| E9 | Novo pedido (`NewOrderForm.tsx:94-95`, `Orders.tsx:46-69`) | Formulário limpa e fecha mesmo se o insert falhar; recibo pode imprimir ID temporário fictício (0–1000) | Só confirmar após persistência; usar registro retornado |
| E10 | WhatsApp/Push | "Mensagem copiada" sem aguardar a cópia; falha de inscrição push engolida | Confirmar apenas no sucesso |

**Não são dados fictícios** (usos legítimos): `Math.random()` em animação, jitter de retry e skeleton; gráficos principais do dashboard (consultam `orders` com verificação de erro); metas de cobrança (heurística `receivable/30` — deve ser rotulada como estimativa).

---

## F. Permissões e caminhos alternativos (estado publicado)

### F.1 O que o banco permite hoje [CÓDIGO — migrations M1–M19]

- **30 tabelas operacionais/financeiras** (pedidos, clientes, movimentações, promissórias, despesas, fechamentos, comissões, rotas, acertos, contas de parceiros, cascos, pontos, revendedores, frota, WhatsApp, cheques, tarefas, lembretes, conferências, requisições, templates, recompra, configurações de estoque): **SELECT/INSERT/UPDATE/DELETE para qualquer autenticado da empresa**, sem distinção de papel.
- **`orders`**: ainda mais amplo — CRUD pela empresa **ou** por `user_id = auth.uid()` (policies cumulativas, combinadas por OR).
- **5 tabelas de configurações** (sistema, financeiras, entrega, segurança, notificações): policy antiga não removida permite também registros `organization_id IS NULL` — isolamento incompleto.
- **`dashboard_data`**: leitura/escrita de registros `system` sem exigir empresa.
- **Exceções mais restritas**: `colaboradores` (admin), `profiles`, `user_roles` (somente leitura própria), localização e push (próprio usuário).
- **`useUserRole` assume "admin" quando o perfil não carrega** (`useUserRole.ts:18-28`); `permissions.ts` retorna admin para todo autenticado; um segundo `RoleGuard` em `components/ui` ignora `allowedRoles`.

### F.2 Consequências práticas

- Um entregador (ou qualquer conta) pode, por chamada direta à API, ler e alterar caixa, promissórias, comissões e estoque da empresa inteira. A tela esconde; o banco permite.
- O filtro "minhas entregas de hoje" é convenção da consulta, não segurança.
- [SUSPEITA] `has_role()` teve EXECUTE revogado de `authenticated` (M15:94) mas é chamada por policies de `colaboradores`, localização e perfis — pode haver erro de permissão em caminhos que deveriam funcionar. **Teste necessário em ambiente isolado.**
- Fila offline reenvia com a sessão vigente: troca de conta no mesmo aparelho pode gravar pendências de um usuário sob outra sessão.

### F.3 G0.1 (candidata, NÃO publicada)

Endureceria verificação de perfil/sessão e administração de usuários, mas **não altera nenhuma das 52 policies operacionais**, não muda `get_my_org()`, e não revoga tokens já emitidos. Os problemas F.1/F.2 permaneceriam após aplicar a G0.1. A validação pelo gateway gerenciado do Cloud continua pendente (bloqueio registrado em `g0.1/README.md`).

---

## G. Melhorias e módulos recomendados

### G.1 Correções de integridade (fazer primeiro)

| # | Problema | Prioridade | Esforço | Teste de validação |
|---|---|---|---|---|
| 1 | RLS por papel nas tabelas operacionais/financeiras; remover policies antigas duplicadas; corrigir fallback "admin" | **Crítica** | Médio | Chamadas diretas com token de entregador devem falhar |
| 2 | Recebimento parcial de promissória: saldo residual + histórico de parcelas | **Crítica** | Médio | Receber R$ 50 de título de R$ 100 → permanece pendente com saldo 50 |
| 3 | Vínculo real pedido ↔ promissória (coluna `order_id`) e criação transacional | **Crítica** | Médio | Venda a prazo sempre gera título; cancelar venda cancela título |
| 4 | Baixa de estoque nos caminhos de entrega/rua/rota, com `referencia_id` real e idempotência | **Crítica** | Alto | Cada venda tem exatamente um movimento correspondente |
| 5 | Status terminal único (`delivered`) ou consolidação explícita de `completed` em caixa/acerto | **Alta** | Baixo | Venda na rua aparece no total do dia |
| 6 | Classificador de pagamento unificado (money/credit/debit ↔ dinheiro/cartão) em comissões e acerto | **Alta** | Baixo | Venda em dinheiro gera comissão correta |
| 7 | Unicidade de fechamento por dia/tipo + reconciliação com sangrias e recebimentos | **Alta** | Médio | Segundo fechamento no mesmo dia exige reabertura explícita |
| 8 | Remover/substituir indicadores e relatórios fictícios (E1–E6) | **Alta** | Baixo | Nenhum número sem fonte real identificada |
| 9 | Cancelamento/edição: verificar status anterior, origem e modalidade real antes de estornar | **Alta** | Médio | Cancelamento duplo não credita estoque duas vezes |
| 10 | Fuso America/Bahia explícito em todas as consultas por dia | **Média** | Médio | Venda às 22h conta no dia local correto |
| 11 | Fila offline com isolamento por usuário e par pedido+promissória atômico | **Média** | Médio | Troca de conta não reenvia pendências alheias |
| 12 | Configurações: ligar ou remover (timeout de sessão, taxa de entrega, notificações) | **Média** | Médio | Cada opção salva tem efeito observável |

### G.2 Novos módulos (depois das correções)

| Módulo | Problema resolvido | Dados necessários | Dependências | Esforço | Prioridade |
|---|---|---|---|---|---|
| Compras e fornecedores | Não há custo de mercadoria → lucro incalculável | Fornecedores, notas de compra, custo por produto | G.1.6, G.1.7 | Alto | Alta (viabiliza rentabilidade real) |
| Controle de carga por entregador | Carga, venda e retorno não reconciliam | Vínculo rota ↔ vendas ↔ retorno | G.1.4, G.1.5 | Médio | Alta |
| Livro de recebimentos integrado ao caixa | Recebimentos de títulos não entram no caixa | Parcelas (G.1.2) + lançamento de caixa | G.1.2, G.1.7 | Médio | Alta |
| Pagamentos parciais / saldo de fiado | Quitação prematura apaga dívida | Parcelas e saldo por cliente | G.1.2, G.1.3 | Médio | Alta |
| Rastreabilidade de cascos emprestados | Dois controles paralelos divergentes | Unificar saldo × registro nominal | G.1.4 | Médio | Média |
| Conciliação diária estoque + dinheiro | Fechamento não reconcilia | Fonte única de caixa | G.1.7 | Médio | Média |
| Auditoria de alterações | Edições/cancelamentos sem trilha | Tabela de eventos com autor e antes/depois | G.1.1 | Médio | Média |
| Rentabilidade por custos reais | Margem hoje é fictícia | Módulo de compras | Compras | Alto | Média |
| Indicadores de entrega e recompra comprovados | Métricas atuais inventadas | Dados reais de entrega/recompra | G.1.8 | Baixo | Baixa |

---

## Cobertura da auditoria

**Examinado:** 35 rotas e todas as páginas; 8 edge functions; 30 migrations e 52 policies; hooks de vendas, caixa, estoque, comissões, promissórias, despesas, offline; fila IndexedDB e service worker; dados reais de 13 tabelas operacionais via consultas de leitura.

**Não examinado / pendente:**
1. Estado efetivo do banco publicado vs migrations (drift) — requer inspeção de catálogos.
2. ACL efetiva de `has_role()` — requer teste autenticado em ambiente isolado.
3. Existência de agendamento externo para `fechamento-portaria-automatico` e disparo de `send-push`.
4. Comportamento real da fila offline com app fechado e troca de conta.
5. Validação da G0.1 pelo gateway gerenciado do Cloud (bloqueio já registrado).
6. Teste de fuso com venda real entre 21h e 23h59.

*Relatório gerado sem alterar código, banco, permissões ou dados. Nenhuma correção foi implementada nesta etapa.*
