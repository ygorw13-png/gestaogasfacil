# Auditoria funcional GásFácil (somente leitura)

Restrições: não alterar código/banco/permissões/dados; não publicar; não aceitar drafts; não testar em produção. Preservar G0.1 e pendência do gateway. Separar estado publicado de candidatos G0.1.

## Checklist de cobertura
- [ ] 1. Inventário: rotas, telas, hooks, funções backend, RPCs, triggers, agendamentos
- [ ] 2. Matriz de integração entre módulos (vendas, portaria, carga, cascos, promissórias, caixa, comissões, offline)
- [ ] 3. Fontes de verdade e cálculos (estoque, valores, caixa, comissão, fuso, status)
- [ ] 4. Dados fictícios / resultados enganosos (mocks, Math.random, fallbacks, sucesso prematuro)
- [ ] 5. Reconciliação somente leitura (consultas SQL de leitura)
- [ ] 6. Permissões e caminhos alternativos (tela vs chamada direta vs entregador vs offline)
- [ ] 7. Sugestões de melhorias e novos módulos
- [ ] 8. Entrega: relatório Markdown em /mnt/documents + resumo no chat
