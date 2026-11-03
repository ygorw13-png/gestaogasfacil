# G0.1 — Candidato administrativo, revisão 2 (nova implementação, chat principal)

Status: **NÃO PRONTO PARA PRODUÇÃO**. Não implantado, sem migração aplicada, nenhum draft aceito. Não tem relação com as 44 verificações do draft inacessível.
Infraestrutura: Lovable Cloud gerenciado; nenhum Supabase externo.

## Mudanças da revisão 2
- **Criação**: a conta precisa nascer bloqueada (`ban_duration` na própria criação) e o Auth precisa confirmar `banned_until`. Sem a validação desse suporte (`G01_CREATE_BANNED_VALIDATED=true`), a criação responde `CREATE_UNAVAILABLE` antes de qualquer gravação. Não há mais exclusão compensatória.
- **`deleteOrphanOrganization` removido**: empresas são preservadas (ver `PROVISIONING_LIMITATIONS.md`).
- **Respostas verdadeiras**: depois da primeira gravação, qualquer falha, inclusive resposta perdida após um efeito real, retorna um erro `*_INCOMPLETE` específico com pedido de conferência. Nenhuma mensagem afirma bloqueio ou remoção. O sucesso só é retornado depois de leituras de confirmação.
- **Desativação**: (1) `profiles.ativo=false`, (2) bloqueio no Auth, (3) leitura dos dois. **Reativação**: papel verificado → `ativo=true` → leitura → desbloqueio por último → leitura.

## Novo login × token já emitido
- **Novo login e refresh**: impedidos pelo bloqueio no Auth.
- **Access token já emitido** (válido até expirar, cerca de 1 h): o bloqueio **não** o revoga. Ele só é negado onde o backend verifica `ativo`/papel canônico. A migração G0.1 cobre as funções de perfil/papel (`get_my_org`, `set_user_role`, verificação de perfil) e estes endpoints administrativos. **Ela não revisa todas as políticas operacionais** (pedidos, estoque, financeiro etc.). Nessas tabelas, um token emitido antes da desativação pode continuar funcionando até expirar.

## Comandos
```
deno test --allow-env tests/admin.test.ts tests/admin-failure.test.ts
deno check candidate/supabase/functions/create-user/index.ts candidate/supabase/functions/manage-user/index.ts
```
