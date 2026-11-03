# G0.1 — Limitações de provisionamento (registro separado)

1. **Trigger de cadastro**: hoje, toda conta nova recebe uma empresa própria e o papel `admin`, ativo. O candidato depois move o perfil para a empresa do admin e grava o papel pedido. A empresa criada pelo trigger **fica no banco**: esta etapa não faz limpeza automática nem exclui empresas.
2. **Criação já bloqueada**: o SDK em uso (`@supabase/auth-js` 2.106.2) aceita `ban_duration` em `admin.createUser`, mas isso só cobre os tipos. Não foi confirmado num ambiente isolado que o servidor de login aplica o bloqueio no momento da criação. Enquanto isso não for confirmado, a criação fica **indisponível** (`CREATE_UNAVAILABLE`) e nenhuma conta é criada. Ela só é liberada com a variável `G01_CREATE_BANNED_VALIDATED=true`, que deve ser definida depois da validação.
3. **Sem compensação**: nenhuma exclusão automática é usada como garantia. Se uma operação ficar incompleta, a resposta é `PROVISIONING_INCOMPLETE` e o caso precisa ser conferido manualmente.
4. **Redesenho** (fora desta etapa): o trigger não deve conceder `admin` nem criar empresa para contas criadas por um admin.
