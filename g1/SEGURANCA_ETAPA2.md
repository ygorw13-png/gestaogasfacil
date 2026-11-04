# G1 Etapa 2 — candidatos de segurança (04/11/2026)

**Status: CANDIDATO. Não aplicado no Cloud, não publicado.** Testado só em PostgreSQL 17.11 descartável em 127.0.0.1, com a estrutura das 30 migrações do projeto (43 tabelas, 52 regras — mesmas contagens do Cloud) + `g0.1/sql/001_profile_verification.sql`, e dados fictícios.

## Arquivos

| Arquivo | Conteúdo | SHA-256 |
|---|---|---|
| `g1/candidate/sql/002_isolamento_inativos.sql` | Isolamento entre empresas, bloqueio de contas inativas, sem papel por padrão | ver `MANIFEST.sha256` no pacote |
| `g1/candidate/sql/002_rollback.sql` | Restaura as definições publicadas (lidas do banco em 04/11) | idem |
| `g1/candidate/sql/003_matriz_por_papel_RASCUNHO.sql` | **Rascunho** da matriz por papel — aguarda decisão 15; não aplicar | idem |
| `g1/tests/sql/fixtures.sql`, `run_security.py` | Dados fictícios e 27 verificações de recusa/continuidade | idem |

## O que o candidato 002 muda

1. `get_my_org()` só devolve a empresa de conta **ativa**. Efeito: as 40+ regras "da própria empresa" passam a recusar conta inativa **na hora**, inclusive com token antigo (fecha a pendência "até 1 hora" da G0.1 para tabelas operacionais).
2. `has_role()` e `current_profile_role()` só valem para conta ativa; sem perfil = nenhum papel (sem padrão admin no banco).
3. Pedidos: removido o caminho "pedido do próprio usuário", que permitia gravar pedido com a empresa de outra pessoa.
4. `dashboard_data`: linhas "system" eram lidas/alteradas por qualquer empresa; agora só pela própria empresa.
5. Localização do entregador: atualização não pode trocar a empresa.
6. Perfil próprio não pode ser criado já dentro de uma empresa escolhida pelo usuário.
7. Movimentação da portaria: recusa explícita para conta inativa/sem empresa.

Não cria papéis, não muda o que "user" pode fazer, não aplica a matriz por papel.

## Resultados (banco descartável)

| Rodada | Resultado |
|---|---|
| Regras atuais (antes) | 18/27 — reproduz 9 falhas: pedido gravado na empresa B; dados "system" da empresa B lidos e alterados; perfil criado dentro da empresa B; inativo lê pedidos, grava pedido e registra movimentação; admin inativo mantém papel e lê colaboradores |
| Candidato aplicado | **27/27** |
| Rollback aplicado | 18/27 (volta exatamente ao comportamento atual) |
| Candidato reaplicado (2×, idempotente) | 27/27 |
| Rascunho 003 | Só sintaxe: aplicado e desfeito em transação (52 → 129 → 52 regras). **Sem teste funcional por papel** — as regras não foram decididas |

Continuidade confirmada: usuário ativo lê e grava pedidos da própria empresa; entregador lê pedidos (regra atual) e atualiza a própria localização; admin mantém papel e lê colaboradores; movimentação da portaria grava na empresa correta; pedidos lançados por quem foi desativado continuam visíveis para a empresa (histórico preservado).

Verificação nos dados reais (somente leitura) antes de propor: 0 pedidos sem empresa, 0 pedidos com empresa diferente do autor, 0 perfis inativos, 0 perfis sem empresa, 0 localizações com empresa divergente, `dashboard_data` vazio. Ou seja, endurecer as regras não esconde nenhum registro existente.

## Retirada de fallbacks administrativos

- **Banco:** feita no 002 (itens 1–2).
- **Telas e funções:** os padrões "admin" ainda presentes no código publicado (`useUserRole` assume admin sem perfil; `permissions.ts` devolve admin para todos; `get_user_profile` e cadastro criam admin) já estão substituídos no candidato G0.1 (`g0.1/candidate/`), sem alteração neste lote.
- Com o 002, mesmo que a tela publicada mostre menus de admin, o banco recusa as ações de quem não é admin ativo.

## Dependências e ordem sugerida (para decisão de publicação, não executada)

1. G0.1 (sequência em `g0.1/PUBLICATION_SEQUENCE.md`) — o 002 pressupõe o SQL da G0.1.
2. 002 logo após o SQL da G0.1, com o smoke test de continuidade (login, pedido, portaria, entregador).
3. Rollback pronto: `002_rollback.sql` em transação única.
4. 003 só depois da decisão 15 e de testes funcionais por papel.

## Pendências

- **Gateway gerenciado do Cloud:** continua **não verificado** (registrado desde a G0.1). Nada deste lote dependeu dele; a publicação continua dependendo.
- Criar empresa: qualquer conta autenticada ainda pode criar uma empresa vazia para si (não dá acesso a outra empresa). Tratamento depende da decisão de cadastro de colaboradores da G0.1.
- `get_user_profile` publicado responde sem token (correção já no candidato G0.1).
