# Melhorias sugeridas (depois do núcleo operacional)

Registradas para priorização. **Nenhuma foi iniciada**: o núcleo vem antes.

| Prioridade | Melhoria | Benefício prático |
|---|---|---|
| Alta | Ambiente de homologação separado da produção (hoje o preview grava no banco real) | Testar antes de publicar sem risco aos dados |
| Alta | Laboratório de navegador automatizado (PostgREST + gateway + build) no fluxo de testes | Exercitar as telas novas com o backend real isolado a cada mudança |
| Alta | Fechamento de caixa somando dinheiro de acertos e de títulos (depois da decisão 10) | Caixa do dia bate com recebimentos e acertos |
| Média | Prestação de contas do cobrador (mesmo modelo do acerto do entregador) | Dinheiro de títulos cobrados na rua sai de "aguardando" com registro |
| Média | Encerramento de carga com conferência física (cheios e vazios devolvidos) | Fecha o ciclo diário da carga |
| Média | Histórico de mudança de status do pedido (`pending`↔`delivering`) | Rastreabilidade completa do pedido |
| Média | Relatórios e Excel com a data operacional (Bahia) e os quadros de recebido separados | Relatórios coerentes com o painel |
| Baixa | Rastreamento do entregador com o app fechado (exigiria empacotar o PWA) | Só se virar necessidade real |
| Baixa | Remover os hooks genéricos e o código de exemplo sem uso | Menos código a manter e testar |
