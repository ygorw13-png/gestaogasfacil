# G0.1 — Candidatos administrativos (nova implementação, chat principal)

Status: **NÃO PRONTO PARA PRODUÇÃO** — não implantado, sem migração, sem draft aceito.
Nova implementação feita em 2026-11-03 a partir do código atual. Não possui relação com as 44 verificações do draft inacessível.

## Infraestrutura
Lovable Cloud gerenciado (managed by Lovable). Nenhum projeto Supabase externo conectado. A pasta `supabase/` é a infraestrutura do Lovable Cloud e foi mantida intacta.

## Arquivos (SHA-256)
- `candidate/supabase/functions/_shared/g01-admin-core.ts` — 2376f468b57326c7b7df971b78cc08ca78ed0b9c4f5c963a771155c3d83fd101
- `candidate/supabase/functions/_shared/g01-admin.ts` — dafa3a7472540a3cbf8269d6c9bcf1abc53238f363b404a41404f188905b1b46
- `candidate/supabase/functions/create-user/index.ts` — 3666d032a4f52e5e76631fbf3eccc5d779affcd7c9ec1468c9f5de8cbf4aaa87
- `candidate/supabase/functions/manage-user/index.ts` — 9fdb3097ade3da948640f8c0c9100fbb3dfde878483d94dc8922e5feda4c72ab
- `tests/admin.test.ts` — 2ba714cfa870507ffd91958e42995798ca1c51350c025510ee6a608a8db3cf41

## Regras
- Admin: sessão válida, perfil `ativo = true`, empresa preenchida, exatamente um papel em `user_roles` igual a `profiles.role`, e esse papel deve ser `admin`. Perfil ausente não é recriado.
- Outra empresa e alvo inexistente: mesma resposta 404. Toda ação sobre a própria conta é recusada.
- Campos estritos por ação; papéis aceitos só `admin`, `user`, `entregador`.
- Criação: a conta fica bloqueada até todas as etapas terminarem, e o desbloqueio é a última gravação. Se algo falha, a conta é removida; se a remoção também falha, ela continua bloqueada e a resposta é `PROVISIONING_INCOMPLETE`. Nunca devolve sucesso parcial.
- Desativação: bloqueia o login antes de gravar o perfil. Reativação: só com papel consistente, e o desbloqueio vem por último.
- Troca de papel: usa a RPC `set_user_role` da G0.1 com o token do próprio admin (atômica no SQL) e confirma o resultado depois.
- Novas ações `set_role` e `update_profile` (só o nome). Formato de resposta compatível com as telas atuais (`{user}` / `{ok}` / `{error}`).

## Resultados
- `deno test --allow-env tests/admin.test.ts`: 41 aprovados, 0 falhas (Deno 2.8.3).
- `deno check` de create-user e manage-user: sem erros.
- Testes usam repositório em memória com dados fictícios.

## Pendente (critério para publicar)
1. Testar contra o login e o banco reais num ambiente isolado (não produção): criar, trocar papel, desativar, reativar, editar e excluir.
2. A troca de papel depende da migração `sql/001_profile_verification.sql` (`set_user_role` e a proteção de perfil). Sem ela, a RPC atual do Cloud aceita regras mais fracas.
3. Mover para `supabase/functions/` **implanta automaticamente** em produção. Isso exige sua aprovação explícita antes.
