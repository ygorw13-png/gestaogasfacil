# G1 010 — integração essencial do lote 4

11/11/2026. Candidato; nada aplicado no Cloud ou publicado.

## Feito

- Proteções de gravação direta do lote 4 integradas em `010_protecoes_lote4.sql`, depois de 001–009.
  O 005 existente não foi substituído. Preservados saldo/abertura, data Bahia, tipo canônico,
  comodato, pagamentos e chave presa ao conteúdo. Contexto controlado restaurado ao final das ações.
- Fila bloqueia gravações diretas antigas, inclusive forçadas; mostra “Não enviado”.
  Preservados o dono de cada lançamento, recusa definitiva, proteção na troca de conta e tratamento
  de resposta incerta. Ação com chave não é descartada automaticamente.
- Integração concentrada no backend e na fila. Arquivos de telas do lote 4 não foram sobrepostos
  às telas mais recentes da continuidade 009. Melhorias secundárias ficam fora deste lote.

## Testes executados

| Verificação | Resultado |
|---|---|
| Proteções H1–H6 do lote 4, adaptadas ao laboratório atual | 43/43 |
| Estoque, rollback, reenvio e concorrência sobre 001–010 | 14/14 |
| Regras frontend e fila | 71/71 |
| TypeScript | Passou |
| Build | Passou |

Testes SQL no PostgreSQL 16.4 local, somente fixtures. Duas adaptações do laboratório: usa
`psycopg[binary]` no lugar do executável psql; a portaria fictícia abre com saldo para os cenários
antigos. A baixa avulsa de venda é agora recusada antes de consultar saldo. Na fila, recusa
permanente preserva o estado mais recente “recusado”, em vez do “excedido” esperado no lote antigo.
Não houve nova rodada de navegador nem validação do gateway hospedado. A suíte geral continua
com as pendências registradas na entrega 009.

## Para colocar em uso

O código está integrado, mas essa versão ainda não está no ar. Não há projeto Lovable aberto
na sessão de navegador disponível. É necessário acessar o projeto de edição, conferir o gateway
hospedado e o estado do banco antes de executar a sequência revisada 001–010 e publicar o frontend.
Não aplicar o `005_caminhos_diretos.sql` antigo em cima desta base: suas regras já foram conciliadas
no 010. Os arquivos em `supabase/migrations` e as funções de produção não foram alterados.

Cancelamento B continua bloqueado. Destino PIX/cartão na empresa e acerto diário configurável
continuam decisões conhecidas com implementação pendente nesta base, conforme a entrega 009.
