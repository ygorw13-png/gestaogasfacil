# GásFácil — G0.1: implementação candidata e validação local

Data: 03/11/2026. **Não aplicado nem publicado em produção.**

## Resultado e limite

Foram preparados os dois endpoints de perfil, SQL de verificação, chamadores de cadastro/login, permissões sem fallback administrativo, proteção das telas e controle de respostas atrasadas. Os arquivos ativos de `src/` e `supabase/` permaneceram idênticos, verificados por SHA-256 antes/depois.

O projeto atual compartilha o backend entre prévia e publicação; por isso os candidatos estão fora dos caminhos de implantação automática. Não foi criado um novo ambiente Cloud, não houve migração Cloud, implantação de funções ou publicação. As únicas consultas remotas foram SELECT de políticas e definições de funções. Não foram consultados nem usados registros de clientes/pedidos como fixtures.

**50 testes passaram em 3 arquivos.** SQL executado em PostgreSQL 17 local, descartável, porta 55439/loopback, com esquema mínimo fictício. Endpoints e integração React foram testados com dependências simuladas. Os dois entrypoints também passaram em `deno check`.

**Não equivale a validação hospedada ponta a ponta.** Cadastro por e-mail, JWT real/expiração, gateway HTTP, RLS completo do projeto e login no celular ainda precisam de um ambiente hospedado isolado. Não usamos produção para preencher essa lacuna. Configurações hospedadas de confirmação de e-mail não foram verificadas.

## Regras implementadas

- SQL exige `ativo IS NOT TRUE` como condição de bloqueio: false e NULL são negados, inclusive RPC direta.
- Perfil ausente sempre gera `PROFILE_REPAIR_REQUIRED`, sem INSERT, sem empresa ou papel novo. Não existe uma fonte independente confiável de ativação no esquema atual; propriedade de empresa e papel não são comprovante de ativação.
- Perfil existente deve ter uma empresa válida, exatamente um papel canônico existente e espelho compatível.
- Endpoints validam o JWT via `auth.getUser`, usam chave pública e autorização do próprio usuário, nunca chave de serviço.
- Corpo aceita apenas `user_id` opcional e igual ao autenticado; nem admin lê/cria perfil de terceiro por esses endpoints.
- `get_user_profile` é somente leitura; `create_profile` verifica perfil existente e bloqueia reconstrução ausente.
- Cadastro não chama `create_profile`, não faz INSERT de empresa/perfil no navegador; provisionamento inicial continua exclusivamente pelo trigger existente.
- Permissões desconhecidas, divergentes, pendentes ou com erro não viram admin nem user autorizado.
- Troca/logout limpam imediatamente empresa, perfil e permissões; versões de requisição ignoram resposta antiga. Inicialização atrasada não sobrescreve evento mais recente; espera de verificação tem limite de 10 segundos.
- Identidade offline em cache não autoriza telas protegidas. Isso deliberadamente limita acesso offline até existir verificação segura.
- Cache de consultas é limpo em troca/login/logout. Telas protegidas exibem falha controlada com tentar novamente/sair.

## Evidências de empresa e papel

Foi confirmado por leitura das políticas que usuários autenticados podem criar empresas com `owner_id` próprio. Portanto, uma linha de propriedade existente **não é origem confiável de recuperação**. O candidato não usa propriedade como prova de ativação e adiciona trigger bloqueando mudança de owner_id/id por solicitante autenticado.

`user_roles` tem SELECT próprio e nenhuma política de escrita direta; a RPC administrativa existente era uma via de alteração. O SQL candidato remove grants de escrita direta, bloqueia `set_user_role` sobre a própria conta, exige administrador ativo e mesma empresa do alvo, e mantém o espelho em transação. O guard de perfil bloqueia autoalteração de papel/empresa/ativo/identidade e mudança de empresa mesmo por admin. INSERT autenticado de perfil é revogado para impedir fabricação de evidência/ativação.

Consequência a revisar: transferência de propriedade/empresa e alteração do próprio papel passam a ser bloqueadas; qualquer procedimento administrativo de transferência será separado. Não adicionamos FK a auth.users, não criamos papéis gerente/portaria nem estrutura de recuperação.

## Arquivos finais

`candidate/` usa os caminhos de destino da futura aplicação. **Não copiar para os caminhos ativos nesta etapa.**

- `supabase/functions/_shared/g0-profile-core.ts`: contrato HTTP testável.
- `supabase/functions/_shared/g0-profile.ts`: validação JWT, RPC e consulta limitada com sessão própria.
- `supabase/functions/create_profile/index.ts` e `get_user_profile/index.ts`: entrypoints.
- `src/contexts/auth/services/permissions.ts`: regra única sem fallback.
- `src/contexts/auth/services/userProfile.ts`: leitura validada, erros controlados e chamada explícita de recuperação (sem recuperação automática).
- `src/contexts/auth/verificationState.ts`: versão das requisições, limpeza e limite de espera.
- `src/contexts/auth/useAuthState.ts`: integração com eventos de sessão.
- `src/contexts/auth/AuthProvider.tsx`, `AuthContext.ts`, `types.ts`: sessão, permissões verificadas e cache.
- `src/hooks/useUserRole.ts`, `useLoginForm.ts`, `useRegisterForm.ts`: papel canônico, login condicionado e cadastro sem fallback.
- `src/components/ui/AuthGuard.tsx`, `RoleGuard.tsx` e `src/components/auth/RoleGuard.tsx`: bloqueio protegido e restrição existente do entregador.
- `sql/001_profile_verification.sql`: candidato de migração; aplicado **somente no PostgreSQL fictício local**.
- Cópias inalteradas de `index.ts`, `hooks.ts`, `services/authentication.ts`, `LoadingSpinner.tsx`, `button.tsx` e `pages/auth/Login.tsx` auxiliam resolução local e compatibilidade; não são novas funcionalidades.
- `tests/`: fixture SQL, testes e configuração isolada. Não executar bootstrap em Cloud/produção.

## Testes do Documento 3: rastreabilidade

| Caso | Execução e resultado |
|---|---|
| 1 sem token | HTTP simulado: 401, sem consulta/recuperação. Passou. |
| 2 token inválido/expirado | Resultado de auth simulado: 401. Passou; JWT real hospedado pendente. |
| 3 método/OPTIONS | 405/200 sem escrita. Passou. |
| 4 JSON/campos inválidos | 400. Passou. |
| 5/6 usuário/admin tenta outro ID | 403 antes de consultar ou verificar alvo. Passou. |
| 7 próprio perfil | Adapter real com consultas simuladas: campos limitados/empresa/papel corretos. Passou. |
| 8 perfil ausente leitura | 404 sem recuperação. Passou. |
| 9 falha perfil/papel/empresa | 503, sem liberação. Passou. |
| 10 inativo/NULL/divergente | Adapter + PostgreSQL/RPC real local bloqueiam. Passou. |
| 11 proprietário sem perfil | **Revisado pela nova instrução:** 409/erro de revisão, zero perfil recriado mesmo com empresa/papel. Passou. |
| 12 provas insuficientes | Sem papel, múltiplos papéis, empresa ausente bloqueados em PostgreSQL. Passou. |
| 13 concorrência | Duas sessões PostgreSQL simultâneas: ambas bloqueadas para perfil ausente, zero escrita. Passou. |
| 14 RPC direta | auth.uid obrigatório, anon negado, sem parâmetro de alvo, dados preservados. Passou. |
| 15 confirmação/cadastro | Chamador React simulado não chama endpoints nem inserts; trigger SQL fictício executado. Passou localmente; e-mail real pendente. |
| 16 nova empresa legítima | Trigger existente reproduzido no banco local cria uma empresa e admin inicial; metadata não escolhe empresa/papel. Passou localmente. |
| 17 recuperação de senha | Verificação própria não altera empresa/papel no banco local. Fluxo completo de senha/tela ausente continua fora do escopo. |
| 18 troca A→B atrasada | Controller + hook React: empresa/roles limpos, retorno antigo ignorado, getSession antigo ignorado. Passou. |
| 19 erro/offline | Não autoriza; limite de espera e tela protegida testados. Passou. |
| 20 admin/entregador | Controller preserva papéis verificados. Redirecionamento completo/login real hospedado pendente. |
| adicionais | Tentativa de mudar owner/id, fabricar empresa, escrever papel, promover-se pela RPC, reativar-se ou inserir perfil: bloqueadas. Admin da mesma empresa consegue alterar papel de terceiro em transação; admin de outra empresa não. Passou. |

As linhas ERROR nos logs PostgreSQL representam negações esperadas pelos testes. Resultado final: 3 arquivos, **50 passed**, duração aproximada 5,5 segundos. Não houve teste navegador contra contas reais.

## Pendências antes da produção

1. Disponibilizar ambiente hospedado isolado com fixtures fictícias; validar Auth/JWT/gateway/RLS completo e fluxo real de cadastro/login/admin/entregador/retry/logout em navegador.
2. Testar o candidato aplicado sobre o esquema completo isolado, inclusive funcionalidades administrativas dependentes dos grants alterados. O esquema local é mínimo, não clone da produção.
3. Validar todas as transições de sessão/reautenticação com os serviços reais e atualizar testes legados que presumem acesso administrativo padrão.
4. Recuperação de senha completa continua separada. Não há nova matriz de `user`; os acessos atuais desse papel não foram redesenhados. Não foi realizada revisão completa de segurança de todos os módulos.
5. Backend não fica protegido contra todas as falhas de isolamento apenas com guard visual; as outras RLS do Documento 3 continuam etapas separadas.

## Ordem de publicação proposta — depende de nova autorização

1. Revisão deste pacote e conclusão das pendências hospedadas. Confirmar backup atual pela tela e versão publicada; não restaurar nada.
2. Preparar janela de manutenção com bloqueio seguro do acesso, evitando frontend antigo misturado com endpoints novos.
3. Aplicar o SQL candidato pelo mecanismo de migrações autorizado, em transação; preservar dados existentes. Nunca aplicar `tests/bootstrap.sql`.
4. Promover como conjunto endpoints compartilhados + todos os chamadores + bloqueios/permissões. No projeto atual mover funções aos caminhos ativos causa implantação automática; só fazer isso depois da autorização explícita.
5. Verificar leitura própria/RPC sem efeitos colaterais e testes autorizados de continuidade. Publicar frontend somente com ordem aprovada; saída da manutenção apenas após verificação.
6. Monitorar erros de acesso sem registrar tokens ou dados sensíveis. Não inventar empresa/permissão para contornar falha.

## Contenção segura

- Falha na recuperação: retornar 503 somente em `create_profile`, mantendo leitura própria segura.
- Falha RPC: revogar EXECUTE de `g0_recover_own_profile` para authenticated; manter perfis/empresas/papéis existentes.
- Falha leitura ou compatibilidade: manter acesso protegido bloqueado e erro visível; corrigir forward. Não republicar endpoints antigos vulneráveis nem restaurar admin no navegador.
- Não desfazer guards/grants voltando a autorização ampla como rollback. Não apagar registros. Backup completo é último recurso com autorização específica, jamais reversão padrão.

SQL de contenção, **não executado**:

```sql
REVOKE EXECUTE ON FUNCTION public.g0_recover_own_profile() FROM authenticated;
```

## Confirmação de não alteração de produção

Nenhuma migração, implantação de função, alteração de dados operacionais, conta real, restauração ou publicação foi executada. Os arquivos ativos `src/` e `supabase/` foram comparados por hash e permaneceram idênticos. Foram adicionados apenas candidatos, testes e documentação fora dos caminhos ativos. Os resultados não significam correção já disponível no sistema publicado.