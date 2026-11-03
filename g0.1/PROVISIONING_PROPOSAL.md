# Proposta — provisionamento de colaboradores (não implementada)

## Problema atual
1. O trigger de novo usuário cria uma empresa nova e torna o usuário admin dela.
2. `create-user` depois move perfil e papel para a empresa do admin. A empresa criada fica órfã.
3. Auth, perfil e papel são escritos em chamadas separadas; falhas no meio podem deixar conta parcial.

## O que é possível garantir e o que não é
- **Dentro do banco (uma transação):** perfil, papel canônico, espelho do papel e decisão de empresa podem ser gravados juntos — ou tudo, ou nada.
- **Auth é um serviço externo:** criar, banir ou apagar a conta no Auth não participa da transação do banco. Não existe atomicidade entre os dois. Compensações (banir/apagar após falha) são best effort e podem falhar também; não garantem contenção.

## Desenho proposto
1. **Sem empresa extra.** O trigger de novo usuário passa a ler um marcador confiável definido apenas pelo servidor (`app_metadata.provisioning = 'collaborator'` com `org_id` e `role`, gravados pela função administrativa com credencial de serviço — nunca `user_metadata`, que o usuário edita). Com marcador: cria perfil **inativo** na empresa indicada, com o papel indicado, na mesma transação do insert no Auth. Sem marcador (cadastro público): mantém o comportamento atual de dono de empresa.
2. **Fluxo do `create-user`:**
   - a) Verifica admin ativo e empresa (já no candidato B).
   - b) Cria a conta no Auth já **banida**, com o marcador. O trigger grava perfil inativo + papel numa transação; se falhar, o próprio insert no Auth é desfeito pelo banco (o Auth não cria a conta).
   - c) Chama uma RPC transacional `finalize_collaborator(user_id)`: confere perfil, papel, empresa e marca `ativo = true` — uma transação.
   - d) Só então remove o banimento no Auth.
3. **Estados de falha e efeito:**
   - Falha em (b): nenhuma conta ou conta não criada; nada a limpar.
   - Falha em (c): conta existe, banida, perfil inativo. Fica **fechada** (fail-closed). Registra em tabela `provisioning_pendencias` para o admin repetir ou excluir.
   - Falha em (d): perfil ativo, Auth ainda banido. Usuário não entra; pendência registrada; admin pode repetir o desbloqueio.
   - Nenhum estado intermediário dá acesso, porque o acesso exige Auth desbanido **e** perfil ativo. Isso é contenção por ordem das etapas, não por compensação.
4. **Limpeza:** botão de administrador "repetir/excluir pendência". Exclusão de conta no Auth é best effort e fica registrada; não é tratada como garantida.
5. **Empresas órfãs já existentes:** listar e revisar manualmente; não excluir automaticamente nesta etapa.

## Dependências e testes necessários
- Depende das frentes A e B e de uma migração nova no trigger (aplicada só no ambiente isolado até aprovação).
- Testes: cadastro público continua criando empresa; colaborador não cria empresa; falha injetada em cada etapa (b, c, d) deixa a conta sem acesso; marcador em `user_metadata` é ignorado; admin de outra empresa não consegue usar o marcador.
