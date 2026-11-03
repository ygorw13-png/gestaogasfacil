# G0.1 v2 — revisão de sessões e integração completa local

## Alterações desta revisão

O novo `sessionCoordinator.ts` centraliza inicialização, `refresh`, `signIn`, eventos e logout. Cada operação captura uma geração compartilhada. Resultado de `getSession()` é descartado **antes** de aceitar identidade se a geração mudou, houve logout ou a instância foi encerrada. A verificação de perfil mantém seu controle adicional de respostas atrasadas.

Login manual e `SIGNED_IN` com a mesma sessão juntam-se à mesma Promise de verificação; não geram falha espúria no formulário enquanto a interface já está autorizada. Logout fecha o acesso local antes da chamada remota e ignora renovações posteriores mesmo quando a chamada falha. Apenas novo login explícito remove esse bloqueio. Falha tardia do logout anterior não apaga login novo. Repetir após falha relê perfil em vez de reutilizar Promise rejeitada; consulta de sessão também tem timeout de 10 segundos.

## Testes determinísticos executados

Em `sessionCoordinator.test.ts`, 8 testes:

1. `refresh` A pendente → login B → resposta A por último: B permanece; formulário retorna sucesso.
2. `refresh` pendente → logout: resposta anterior não restaura identidade, empresa ou permissões; logout bem-sucedido.
3. evento `SIGNED_IN` antes do resultado manual: uma consulta de perfil e sucesso ao formulário.
4. resultado manual antes do evento: uma consulta de perfil e sucesso ao formulário.
5. logout com erro → renovação: continua bloqueado; login explícito B posterior funciona.
6. logout enquanto getSession manual está pendente: formulário retorna falha e acesso permanece bloqueado.
7. erro tardio de logout não apaga login novo autorizado.
8. retry após erro faz nova leitura e libera somente se válida.

Resultado final candidatos: **58 testes aprovados em 4 arquivos**. Mais **8 testes legados de autenticação aprovados em 3 arquivos** na cópia completa. Esses números não contam testes hospedados.

## Frontend completo e contratos

Foi criada `/tmp/g0.1-v2/frontend` com `src`/`public` completos e configurações, sem `.env`, `.git` ou credenciais. Candidatos foram sobrepostos apenas nessa cópia. Dependências existentes usadas por link local, não incluídas na entrega.

- `bun run build`: exit 0, PWA gerada; aviso de chunks >500 kB, sem erro.
- `tsgo --noEmit -p tsconfig.app.json`: exit 0.
- `deno check` nos endpoints de perfil: aprovado.
- Consumidores `fetchUserProfile`: hook passa a consumir `VerifiedProfile`; recuperação explícita revalida esse contrato. Não há consumidor ativo adicional da antiga resposta de empresa.
- `hasUserRole`/`getUserRole`: eram usados pelo provider e reexportados pelo barrel. Provider agora usa estado de permissões verificado; reexports mantidos com assinatura fail-closed. Nenhum consumidor ativo adicional foi encontrado.
- `AuthContext`: tipagem/default/provider alinhados; `useUserRole` passa a usar o mesmo contexto, não outra consulta com fallback. Fixtures dos testes legados receberam `permissions`/`profile` e papéis existentes.
- Os testes de Provider agora envolvem QueryClientProvider como a árvore real do app. Teste de login usa entradas de formulário, não antiga frase removida da tela.

Os arquivos ativos de `src` e `supabase` foram comparados com hashes **no projeto principal**, não com a cópia candidata, e permaneceram idênticos. Nenhuma publicação, migração ou implantação no projeto principal foi executada.

## Esquema completo isolado e administração

Foi iniciado o draft separado **G0.1 validação isolada**, sem aceitá-lo ou publicá-lo. Sua validação só pode gravar após confirmar isolamento; se gateway/Auth não funcionarem, testes reais hospedados permanecem pendentes. O resultado dessa frente deverá ser anexado separadamente com a distinção de: esquema completo SQL local, runtime local dos endpoints e gateway hospedado.

**Não afirmar que os testes mínimos anteriores validam `create-user`/`manage-user`.** O resultado completo do draft, seus candidatos adicionais e limites devem ser lidos antes da liberação. O SQL da entrega anterior permanece como candidato; nenhuma migração foi aplicada em produção.

## Publicação e contenção

Sem autorização nesta etapa. Ordem proposta após concluir validação isolada: revisar o conjunto → confirmar backup/versão → manutenção fail-closed → SQL autorizado → endpoints seguros e chamadores coordenados como conjunto → validação de continuidade → publicação frontend → sair da manutenção. Não restaurar fallbacks, grants amplos ou endpoints vulneráveis. Em falha de recuperação, 503 e revogar RPC de recuperação; em falha de leitura manter acesso bloqueado e corrigir forward, sem deletar dados.