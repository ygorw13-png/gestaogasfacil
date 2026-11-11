# Implantação G1 010 no Cloud — 11/11/2026

Registro da implantação coordenada do pacote `gasfacil_g1_integrado_010.zip`.

## Aplicado no banco do Cloud (compartilhado por preview e app publicado)
Ordem efetiva (cada arquivo aplicado como migração, conteúdo idêntico ao testado — conferido por `diff` com
`drizzle/migrations/000N_*.sql`):

| Migração | Candidato |
|---|---|
| 0000 | `g0.1/sql/001_profile_verification.sql` |
| 0001 | `g1/candidate/sql/002_isolamento_inativos.sql` |
| 0002 | `003_permissoes_carga.sql` |
| 0003 | `004_integracao_telas.sql` |
| 0004 | `005_tipo_venda_idempotencia.sql` (NÃO o `SUPERADO_005_caminhos_diretos.sql`) |
| 0005 | `006_saldo_portaria.sql` |
| 0006 | `007_carga_telas.sql` |
| 0007 | `008_recebimentos_acerto.sql` |
| 0008 | `009_venda_saldo_portaria.sql` |
| 0009 | `010_protecoes_lote4.sql` |

Não aplicados (por regra): `003_contencao`, `004_contencao*`, `002_rollback`, `SUPERADO_005_caminhos_diretos`.
Contingência de produção: `004_contencao.sql` (mantém as proteções); nunca rollback.

Funções do backend publicadas (candidatos G0.1, idênticos): `manage-user`, `create-user`, `get_user_profile`,
`create_profile`. Criação de colaborador continua desligada (`G01_CREATE_BANNED_VALIDATED` ausente → 503).

## Verificações
- Antes: cópia CSV das 43 tabelas restaurada num banco descartável, conferida tabela a tabela (contagem + md5) e
  ensaio 001–010 sobre a cópia sem alterar colunas originais nem totais. (Cópia ficou em `/tmp` da sessão e foi
  apagada quando o ambiente reiniciou; o backup diário do Cloud deve ser conferido pelo proprietário em
  More → Database → Manage → Backups.)
- Gateway hospedado do Cloud: 15/15 respostas esperadas (sem sessão 401, papel inválido 400, próprio perfil 200,
  perfil de outro 403, criação 503), sem gravações.
- Depois: estrutura do banco real igual à do banco de testes 001–010 — 59 funções (definições idênticas),
  133 políticas, 25 gatilhos, 558 colunas, 76 restrições. Diferença só nas permissões padrão do Cloud
  (`anon` com direito de tabela, bloqueado por RLS sem política para `anon`; funções puras `_produto_chave`,
  `_forma_chave`, `is_*` e de gatilho executáveis por `anon`, sem efeito sem sessão).
- Dados reais intactos: pedidos 143 (R$ 7.290,00), promissórias 54 (R$ 870,00), clientes 11, movimentos da
  portaria 204, fechamentos 4, perfis 2, empresas 2; nenhum registro alterado; tabelas novas vazias.
- Laboratório: suítes SQL 001–010 (43/43, 14/14, 43/43, 31/31, 38/38, 40/40, 69/69, 26/27 esperado, 22/22);
  navegador fluxos essenciais 10/10; frontend 73/73; TypeScript sem erros.
- Preview com a conta do administrador, só leitura: painel, portaria, pedidos e promissórias carregam dados reais,
  nenhuma requisição com falha.

## Frontend
`G1_ACOES` ligada por padrão (`VITE_G1_ACOES=off` desliga). Data da portaria em America/Bahia.

## Uso a partir de agora
- Primeira operação de cada dia: **Confirmar abertura** na portaria (vendas de balcão e saídas para carga são
  recusadas sem abertura e sem saldo).
- Entregador só conclui entrega/venda na rua com produto na carga (saída da portaria antes).
- Cancelamento de venda concluída continua bloqueado (decisão B pendente).
- Lançamentos antigos guardados em aparelhos offline como gravação direta não são enviados ("Não enviado").

## Pendente
Decisão B (estorno), decisão 13 (preço agregado/ponto), destino PIX/cartão e periodicidade do acerto;
criação de colaborador (503 até validação); coordenador de sessão G0.1 (`g0.1/candidate/src`) não integrado.
