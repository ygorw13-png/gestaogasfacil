# GasFácil — continuidade G1: bloqueio de venda por estoque (009)

Data: 10/11/2026. Desenvolvimento e testes isolados; nada aplicado nem publicado em produção.

## Base preservada

O anexo `gasfacil_g1_lote3(1).zip` é incremental: não contém o projeto completo. A base completa recuperada de
`gasfacil_continuidade_1.zip` já inclui esse lote e as melhorias SQL 005–008, telas de carga e acerto. Ela foi
preservada; os arquivos antigos do anexo não foram sobrepostos a arquivos mais recentes.

## Entregue neste lote

- Candidato `009_venda_saldo_portaria.sql`: exige abertura no dia operacional da venda e saldo suficiente.
  Recarga/completa/comodato conferem cheios; venda de vasilhame confere vazios. Saldo de pátio, de outro
  produto ou de outro dia não libera venda. A verificação usa a mesma trava da transferência para carga.
- A recusa desfaz a transação inteira: não deixa pedido, recebimento nem chave de envio. Reenvio de uma
  venda já confirmada não baixa estoque novamente.
- Scripts `reset_com004.sh` até `reset_com008.sh` passam a interromper ao falhar a aplicação do candidato.
  Antes, o trecho `| grep -v NOTICE || true` ocultava a falha e permitia imprimir “aplicado”.
- `reset_com009.sh` e suíte própria adicionados. A suíte Python usa `psycopg[binary]` e só aceita
  host `127.0.0.1`. Deve rodar em banco descartável com fixtures, pois os cenários de concorrência
  confirmam transações e limpam as tabelas fictícias no final.
- Arquivo de dependências `package-lock.json` sincronizado com `package.json`: `npm ci` antes recusava a base.
- Inserção de pedido tipada com o tipo gerado existente; resolve erro de inferência do cliente Supabase.
- Removido `src/pages/promissory/data/mockData.ts`, sem consumidores, já previsto para remoção no checklist.

## Verificações desta sessão

| Verificação | Resultado |
|---|---|
| Candidato 009 sobre esquema real das 30 migrations + 001–008, PostgreSQL **16.4**, loopback e fixtures | **14/14** |
| Concorrência duas vendas pelo último cheio | Uma confirma, a outra recusa; saldo final zero |
| Concorrência venda × transferência para carga | Uma confirma, a outra recusa; saldo final zero |
| Scripts de aplicação interrompem na falha | **12 cenários** (6 scripts × sucesso/falha), todos passaram |
| `vitest run src/lib` | **64/64 testes** |
| `tsc --noEmit -p tsconfig.app.json` após correções | **Passou** |
| `npm run build` após correções | **Passou**, aviso de tamanho de bundles |
| Suíte geral `vitest run` (diagnóstico antes das correções de tipos) | **119 passaram / 24 falharam**, mais 8 arquivos sem testes coletados |

A suíte geral inclui testes Deno coletados pelo runner errado, integração que exige laboratório próprio e
falhas legadas de login/usuários/checkbox/hooks. Não se afirma que a suíte geral passou. Os resultados
estruturados das suítes aprovadas estão em `g1/tests/resultado_frontend_continuidade.json` e
`g1/tests/sql/resultado_vendas009.json`.

O laboratório desta sessão usou o motor PostgreSQL 16.4 obtido do pacote de runtime
`@embedded-postgres/linux-x64@16.4.0-beta.14` e conexão psycopg, aplicando os arquivos SQL em transações.
Não foi usado o script de criação do cluster, que pressupõe binários de sistema e permissões de root.
A camada de acesso do teste é direta ao PostgreSQL: navegador e gateway hospedado não foram validados aqui.

## Estado e sequência seguinte

- O 009 fica em `g1/candidate/sql/`, fora das migrations ativas. A chave `VITE_G1_ACOES` permanece como recebida.
- Cancelamento de venda concluída continua bloqueado (decisão B).
- PIX/cartão na conta da empresa e acerto diário configurável foram recuperados como decisões do proprietário;
  **a implementação dessas duas regras ainda está pendente nesta base**. O 008 continua tratando valores
  não monetários como destino não informado; não apresentar isso como resolvido.
- Próximo lote: implementar destino empresa e política do acerto diário; a integração com fechamento/reabertura
  ainda exige definir as regras da decisão 10. Nenhum dado histórico deve ser reclassificado automaticamente.
- Antes de produção: resolver a suíte geral, testar as telas novas em navegador isolado, verificar o gateway
  hospedado do Cloud e revisar a implantação coordenada. Os candidatos 001–009 não estão aplicados no Cloud.

Reprodução do novo teste: `python3 -m pip install 'psycopg[binary]'`, preparar o banco descartável com
`G1DB=<pasta_de_laboratorio> bash g1/tests/sql/reset_com009.sh`, depois
`python3 g1/tests/sql/run_vendas009.py postgresql://postgres@127.0.0.1:55450/postgres`.
