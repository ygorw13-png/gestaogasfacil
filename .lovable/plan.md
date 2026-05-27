## Visão geral

3 frentes em uma entrega:

1. **Despesas** com rastreio de origem do dinheiro (combustível simplificado + diversas) + integração com caixa da portaria
2. **Agregados/Revendedores** com apenas P13
3. **Perfil Entregador** com fluxo completo: notificação (som + push PWA), mapa, aceitar/recusar, confirmar entrega, acerto na portaria

---

## 1. Despesas — origem do dinheiro

### Banco de dados
- Nova tabela `despesas` (unificando combustível, manutenção, diversa, fixa):
  - `tipo` ('combustivel' | 'manutencao' | 'diversa' | 'fixa')
  - `veiculo_id` (nullable, só combustível/manutenção)
  - `descricao`, `categoria`, `valor`, `data`
  - **`origem_dinheiro`** ('caixa_portaria' | 'cofre' | 'banco' | 'pessoal')
  - `caixa_movimentacao_id` (link para sangria quando origem=portaria)
  - `observacoes`, `organization_id`, `registrado_por`
- Novo tipo de movimentação no `movimentacoes_portaria`: `sangria_despesa` (delta_cheios/vazios=0, só registra saída de dinheiro com `valor_dinheiro` e link pra despesa)
- Coluna nova `valor_dinheiro NUMERIC` em `movimentacoes_portaria` (hoje só conta cilindros)

### UI Combustível (simplificado)
- Form com: Veículo (select dos cadastrados) → Valor Total → Origem do dinheiro → Data → Observações
- Remove: litros, R$/litro, posto, tanque cheio (vira opcional em "detalhes avançados" se quiser)
- Se origem = "Caixa Portaria" e caixa fechado → bloqueia com mensagem

### UI Diversas
- Adiciona campo Origem do dinheiro com mesma lógica

### Integração caixa portaria
- Salvar despesa com origem=portaria → registra `sangria_despesa` automaticamente
- Fechamento de caixa subtrai sangrias do dinheiro esperado
- Histórico de movimentações mostra despesa vinculada

---

## 2. Agregados — só P13

- Em `NewResellerForm.tsx` e `ResellerDetailsDialog.tsx`: remover campos `priceP20`, `priceP45`, `priceWater`
- Manter tipos por compatibilidade mas esconder no UI
- Atualizar listagem/relatórios pra não mostrar colunas vazias

---

## 3. Perfil Entregador

### Role e roteamento
- Novo valor no enum `app_role`: `'entregador'` (ou usar campo `colaboradores.cargo='entregador'`)
- `AppSidebar` / `navigation-config`: quando role=entregador, exibir SOMENTE:
  - "Minhas Entregas"
  - "Cadastro Rápido de Cliente"
  - "Nova Venda na Rua"
- `AppLayout`: redirect automático pra `/entregador/entregas` no login
- Bloquear acesso direto a outras rotas via guard

### Tela "Minhas Entregas" (`/entregador/entregas`)
- Lista de orders onde `delivery_person = user.id`
- Filtros: Pendente aceitação / Em rota / Entregue hoje
- Card de pedido pendente mostra: cliente, endereço completo, observações, produtos, valor, forma de pagamento
- Botões: **Aceitar** · **Recusar** (com motivo) · **Abrir no Maps** (`https://www.google.com/maps/search/?api=1&query=...`)
- Pedido aceito → botão **Confirmar entrega** (com checkbox "recebeu vasilhame vazio?")

### Notificação (Ambos)
- **Som + vibração com app aberto**: Supabase Realtime escutando `orders` filtrado por `delivery_person`. Quando insert/update assigned → `new Audio('/alert.mp3').play()` + `navigator.vibrate([300,100,300,100,300])`
- **PWA + Push Notification** (com avisos sobre limitações iOS e preview):
  - Adicionar `vite-plugin-pwa` com guard pra preview (conforme regras PWA)
  - Manifest com ícones, `display: standalone`
  - Service worker para push (`navigateFallbackDenylist: [/^\/~oauth/]`)
  - Edge function `notify-delivery-person` que envia push via Web Push API
  - Tabela `push_subscriptions` (user_id, endpoint, p256dh, auth)
  - Tela do entregador pede permissão de notificação no primeiro login
  - **Aviso ao usuário**: push só funciona em produção (não no preview), e iOS exige instalação na home

### Cadastro rápido de cliente
- Modal com: Nome, Telefone, Endereço (rua, número, bairro, referência)
- Reaproveita `clients` table

### Nova venda na rua
- Form mínimo: produto, qtd, valor, forma de pagamento, cliente (opcional/rápido)
- Marca origem como "venda_rua" — entra no acerto do entregador

### Acerto do entregador (portaria)
- Nova tela `/entrance/acerto-entregadores`
- Por entregador: lista entregas confirmadas + vendas de rua do dia
- Mostra total Dinheiro / PIX / Cartão por entregador
- Botão "Confirmar acerto" → registra movimentação no caixa da portaria como entrada
- Tabela `acertos_entregador` (entregador_id, data, total_dinheiro, total_pix, total_cartao, conferido_por, conferido_em)

---

## Ordem de execução

1. **Migração DB**: tabela `despesas`, coluna `valor_dinheiro` em movimentações, tabela `push_subscriptions`, `acertos_entregador`, role `entregador`
2. **Despesas**: refatorar forms + hook de origem + integração caixa
3. **Agregados**: remover P20/P45/Água do UI
4. **Perfil entregador base**: role guard, sidebar condicional, tela Minhas Entregas com Realtime + som
5. **Cadastro rápido + venda na rua**
6. **Acerto na portaria**
7. **PWA + Push** (por último — mais complexo, requer avisos)

## Arquivos principais

**Criar:**
- `supabase/migrations/...` (despesas, push_subscriptions, acertos, role entregador)
- `supabase/functions/notify-delivery-person/index.ts`
- `src/pages/entregador/MinhasEntregas.tsx`
- `src/pages/entregador/CadastroRapido.tsx`
- `src/pages/entregador/VendaRua.tsx`
- `src/pages/entrance/AcertoEntregadores.tsx`
- `src/hooks/useDeliveryRealtime.ts`
- `src/hooks/usePushNotification.ts`
- `src/components/entregador/DeliveryCard.tsx`
- `public/alert.mp3` (gerar/baixar som curto)
- `public/manifest.json` + ícones
- `vite.config.ts` (PWA plugin)

**Editar:**
- `NewFuelEntryForm.tsx`, `NewExpenseForm.tsx`, `MiscExpenses.tsx` → simplificar + origem
- `NewResellerForm.tsx`, `ResellerDetailsDialog.tsx`, `ResellersList.tsx` → só P13
- `AppLayout.tsx`, `AppSidebar.tsx`, `navigation-config.tsx` → guard entregador
- `App.tsx` → rotas /entregador/*
- `CashierClosing*` → considerar sangrias e acertos no cálculo
- `useCashierSales.tsx` → registrar sangrias quando despesa com origem=portaria

## Observações técnicas

- Web Push requer chaves VAPID — vou gerar e pedir pra você adicionar como secret `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY`
- Som de alerta: vou gerar um beep curto programaticamente ou usar um livre de royalties
- iOS Safari só suporta push em PWA instalada (iOS 16.4+) — vou avisar o usuário entregador na tela
- Service Worker em preview do Lovable é problemático — registro vai ter guard pra só ativar em produção
