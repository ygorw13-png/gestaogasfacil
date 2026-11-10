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
- [x] Lote 4: caminhos diretos fechados (005), fila offline antiga bloqueada, caixa só fecha após gravar, contenção revisada com carga/dívidas/recebimentos (SQL 43/43, 40/40, 69/69, 22/22; navegador 14/14 + 17/17) — candidato, não aplicado
- [ ] Bloqueado: decisão B (estorno); decisão 13 (agregado/ponto); gateway hospedado G0.1; aprovação de produção
