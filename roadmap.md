# Plano de melhorias GásFácil (pós-auditoria)

Regras: só Lovable Cloud; sem migrações/publicação em produção sem revisão prévia com resultado concreto; preservar registros; não inventar valores nem resultados; candidatos identificados por hash; lotes pequenos e revisáveis.

## Etapas
- [x] 0. Consolidar base: g1/CHECKLIST.md + correções de conclusões + estado G0.1/gateway
- [x] 1. Eliminar informações fictícias (frontend, preview apenas) — build OK
- [ ] 2. Segurança: candidato 002 testado 27/27 (não aplicado); 003 por papel aguarda decisão 15 — BLOQUEADO pela decisão
- [ ] 3. Fluxo operacional: decisões v2 entregues — BLOQUEADO aguardando respostas do proprietário
- [ ] 4. Vendas e estoque consistentes (depende de 3)
- [ ] 5. Carga e acerto do entregador (depende de 3/4)
- [ ] 6. Fiado, recebimentos e caixa (depende de 3)
- [ ] 7. Cascos e parceiros
- [ ] 8. Datas, pagamentos, comissões e offline
- [ ] 9. Compras, fornecedores e custos (método de custo = decisão)
- [ ] 10. Relatórios e configurações
- [ ] 11. Auditoria e conferência do histórico
- [ ] 12. Validação e entrega (ambiente isolado)

## Handoff (10/11)
- [x] Entrega para continuidade no Claude Code: `HANDOFF_CLAUDE.md` (estado, decisões, comandos, recursos só no Cloud)
- Próximo passo exato: ver seção 5 do `HANDOFF_CLAUDE.md`

## Lote atual (histórico — substituído pelo HANDOFF_CLAUDE.md)
Validação da Etapa 1 (concluída, 26/26 + 11/11) + candidato de segurança 002 (concluído) + matriz/SQL por papel para revisão.

## Pendências externas
- Gateway gerenciado do Cloud não verificado (G0.1).
- Validação com conta real: não há conta do proprietário no app.

## Lote 2 (04/11)
- [x] 003 por papel + carga + a prazo (69/69, contenção 16/16) — candidato, não aplicado
- [x] Painel: pendentes / concluídas / recebido / a receber
- [x] Telas chamando as ações controladas (lote 3, chave VITE_G1_ACOES; 40/40 SQL, 14/14 navegador)
- [ ] Bloqueado: decisão B (estorno); gateway hospedado G0.1; aprovação de produção

## Implantação G1 010 (11/11) — colocar em uso
- [x] Integrar pacote 010 ao projeto (telas 009 + fila; avisos de cancelamento do lote 4 mantidos; 005 antigo marcado SUPERADO)
- [x] Banco descartável 001–010: suítes SQL; navegador fluxos essenciais 10/10
- [x] Cópia de segurança das tabelas restaurada e conferida; ensaio 001–010 sobre a cópia sem alterar dados
- [x] Funções G0.1 no Cloud + 001; gateway hospedado verificado (15/15)
- [x] Aplicar 002–010 no Cloud (idênticos aos testados; estrutura igual ao banco de testes; dados reais intactos)
- [x] Ligar ações controladas por padrão e publicar
- [ ] Pendente: decisão 13 (agregado/ponto), destino PIX/cartão; criação de colaborador desligada (503); coordenador de sessão G0.1 não integrado

## Decisão B — reversão controlada (11/11)
- [x] SQL candidato 011 (cancelamento, devolução integral, troca por problema, duplicidade; parcial bloqueada)
- [x] Suíte de testes 011 no banco descartável (casos da seção 10 do pedido)
- [x] Telas: solicitar/autorizar, confirmar recolhimento, reembolsos, conferência, painel separado
- [x] Navegador isolado dos fluxos novos
- [x] Cópia de segurança atual, aplicar 011 no Cloud, conferir dados, publicar e confirmar versão

## Fluxo de entregas (12/11)
- [x] Pedido como fonte única; modalidade por origem_venda; data prevista
- [x] Filtros Hoje/Atrasadas/Agendadas; estados corretos; número do pedido abre detalhes
- [x] Atribuir/Reatribuir (motivo, novo aceite, transferência física opcional); cancelar formulário sem erro
- [x] "Concluir entrega" com dados explícitos; a prazo gera promissória
- [x] Fechamento total bloqueado no banco com trava contra concorrência
- [x] Registros antigos: revisão necessária + regularização pelo admin
- [x] Testes SQL 72/72, navegador 24/24; cópia de segurança; aplicado no Cloud
- [ ] Decisão do administrador sobre os 8 registros antigos (ver docs/IMPLANTACAO_G1_012.md)
