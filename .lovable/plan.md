# Plano de execução

Trabalho dividido em **3 frentes paralelas**, entregues em ordem de impacto. Cada frente é independente e pode ser pausada/aprovada.

---

## FRENTE 1 — CRM de Recompra Inteligente (nova ideia, expandida)

Novo módulo **"Recompra"** no menu principal. Mais que só "avisar o gás acabando" — vira um pequeno CRM de relacionamento.

### Como funciona o cálculo
- Para cada cliente, calcula a **média de dias entre compras** (das últimas 6 compras de P13).
- **Previsão**: `data_próxima = última_compra + média_dias`.
- Status do cliente:
  - 🟢 **Em dia** — ainda não chegou a data prevista
  - 🟡 **Hora de comprar** — passou da data prevista, atraso < 30%
  - 🔴 **Atrasado** — atraso > 30% da média (provável risco de perder cliente)
  - ⚪ **Novo cliente** — menos de 2 compras (sem média confiável)

### Tela /recompra
- Filtros: status, bairro, faixa de atraso
- Cards/tabela por cliente com: nome, telefone, última compra, média, próxima prevista, dias de atraso
- 3 botões de ação por cliente:
  1. **WhatsApp Pré-venda** — abre `wa.me` com mensagem: *"Oi {nome}! Notamos que seu gás deve estar acabando. Quer que a gente já agende sua entrega?"*
  2. **WhatsApp Pós-venda** (clientes que compraram nos últimos 3 dias) — *"Oi {nome}! Tudo certo com a entrega de ontem? Qualquer coisa estamos aqui."*
  3. **Registrar contato** — marca data/observação ("ligou", "não atendeu", "vai pensar")

### Melhorias adicionadas além da ideia original
- **Mensagem customizável** nas configurações (template com `{nome}`, `{dias}`, `{ultima_data}`)
- **Aniversário do cliente** (se cadastrado) — disparar mensagem
- **Inadimplência cruzada**: se cliente está em "hora de comprar" E tem promissória em aberto, mostra alerta vermelho
- **Funil de conversão**: dashboard mostrando % de contatos que viraram venda

### Implementação
- Nova tabela `contatos_recompra` (cliente_id, tipo: 'pre'|'pos'|'aniversario', canal, resultado, observacao, data)
- Coluna `data_nascimento` em `clients`
- Nova tabela `templates_mensagem` por organização
- Cálculo feito em hook `useRecompraInsights` (client-side, baseado nos pedidos do mês)
- Página `src/pages/recompra/Recompra.tsx`

---

## FRENTE 2 — Sugestões anteriores

Implementar tudo que ficou pendente da última conversa:

1. **Cliente — autocompletar CEP** (ViaCEP, grátis, sem API key) no NewClientDialog
2. **Cliente — botão "Abrir no Maps"** nos detalhes do cliente
3. **Histórico de rotas real** — criar tabela `rotas` no banco, migrar tela de mock para real
4. **Usuários — botões funcionais**: resetar senha (edge function), desativar, excluir
5. **Despesas — relatório mensal** com gráfico por categoria (Recharts)
6. **Chat entregador ↔ portaria** — Realtime, tabela `mensagens_entregador`, sino no topo

---

## FRENTE 3 — Auditoria modular (módulo por módulo)

Vou abrir cada módulo, **listar todos os botões/ações**, identificar quais são mocks/stubs (chamam só `toast` sem persistir), e **corrigir um por um**, conectando ao Supabase.

Ordem de auditoria (mais usados primeiro):
1. **Clientes** — `handleAddCylinders`, `handleReturnCylinders`, `handleGenerateReport`, ClientDetailDialog tabs
2. **Promissórias** — criar, dar baixa, marcar paga, gerar PDF
3. **Frota** — adicionar veículo, manutenção, abastecimento, atribuir motorista
4. **Inventário** — ajuste de estoque, requisições
5. **Pedidos** — atribuir entregador, completar, cancelar
6. **Dashboard** — substituir mockData por consultas reais
7. **Configurações** — salvar configurações por organização

Para cada módulo entrego: **lista do que estava mock → o que virou real → o que ficou pendente** (com motivo).

---

## Ordem de entrega proposta

```text
Entrega 1 ✅ → Frente 2 itens 1-4 (rápidos, alto valor)
Entrega 2 ✅ → Frente 1 completa (CRM Recompra)
Entrega 3 ✅ → Frente 3 módulos 1-3 (Clientes, Promissórias, Frota) — real Supabase
Entrega 4 → Frente 2 itens 5-6 (despesas com gráfico, chat entregador)
Entrega 5 → Frente 3 módulos 4-7 (Inventário, Pedidos, Dashboard, Configurações)
   + finance dropdowns (NewFuelExpenseForm, maintenance/VehicleSelection) → FleetContext
```

Cada entrega gera 1 migração consolidada + commits de código + relatório curto do que mudou.

---

## Detalhes técnicos

- **Migrations novas**: `clients.data_nascimento`, tabelas `contatos_recompra`, `templates_mensagem`, `rotas`, `mensagens_entregador`, `cylinder_loans` (formalizar comodatos)
- **Edge functions novas**: `reset-user-password`, `delete-user`, `send-whatsapp-template` (opcional, hoje basta `wa.me` no front)
- **Pacotes**: nenhum novo — já temos `recharts`, `date-fns`, `lucide`
- **Realtime**: habilitar `mensagens_entregador` na publication
- **Sem novas integrações externas** (CEP usa ViaCEP público, WhatsApp usa link direto). Push notifications continuam fora até você fornecer chaves VAPID.

---

## O que eu **não** vou fazer sem confirmação
- Reescrever o design system existente
- Mexer em fluxo de autenticação além dos botões pedidos
- Adicionar integrações pagas (Twilio para SMS/WhatsApp oficial, Google Maps Directions API)
- Apagar dados existentes

Aprovação inicia pela Entrega 1.
