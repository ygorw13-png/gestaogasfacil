
# Diretrizes de Segurança para o Projeto

## Chaves de API e Dados Sensíveis

### Chaves Públicas vs. Chaves Secretas
- **Chaves Públicas**: São seguras para serem commitadas no repositório e usadas diretamente no código do frontend (como a chave anônima do Supabase)
- **Chaves Secretas**: NUNCA devem ser commitadas no repositório ou expostas no código do frontend

### Boas Práticas para Dados Sensíveis
1. Use variáveis de ambiente para armazenar chaves secretas
2. Para desenvolvimento local, use um arquivo `.env.local` (não commitado no repositório)
3. Para produção, configure as variáveis de ambiente no seu serviço de hospedagem
4. Para funcionalidades edge/backend que precisam de chaves secretas, use o armazenamento seguro de secrets do Supabase

### Supabase
- A configuração atual usa apenas a chave anônima/pública do Supabase, que é segura para commitamento
- Para chamadas que exigem a chave secreta de serviço, use apenas funções Edge do Supabase, nunca exponha esta chave no frontend

### Outras Chaves de API de Serviços Externos
Se o projeto precisar integrar com outros serviços externos (como OpenAI, Stripe, etc.), sempre siga estas regras:
1. Nunca coloque as chaves secretas diretamente no código
2. Use funções Edge do Supabase para fazer chamadas que exigem chaves secretas
3. Configure as chaves secretas como secrets do Supabase

## Exemplo de Configuração para Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do projeto (já incluído no .gitignore) com este formato:
```
# Supabase - Não é necessário para este projeto, pois já configurado no client.ts
# Apenas para referência em projetos futuros
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Outras APIs (se necessário)
VITE_API_XYZ_PUBLIC_KEY=chave_publica_aqui
```

## Uso de Funções Edge para Operações Sensíveis

Para operações que exigem chaves secretas ou credenciais privadas:

1. Crie funções Edge no Supabase
2. Configure as chaves secretas como secrets do Supabase
3. Acesse as APIs externas através das funções Edge
4. No frontend, chame apenas as funções Edge, nunca as APIs externas diretamente

Exemplo de como chamar uma função Edge de forma segura:
```typescript
// Correto: Chamar função Edge
const { data, error } = await supabase.functions.invoke('minha-funcao');

// INCORRETO: Chamar API externa diretamente com chave no frontend
// const data = await fetch('https://api.externa.com/recurso', {
//   headers: { Authorization: 'Bearer CHAVE_SECRETA_EXPOSTA' }
// });
```

## Revisões Regulares de Segurança

Realize verificações periódicas para garantir que:
1. Nenhuma chave secreta esteja exposta no código-fonte
2. Todas as chamadas a APIs externas sensíveis sejam feitas através de funções Edge
3. O controle de acesso esteja corretamente implementado para todos os recursos

## Políticas de Senha

As seguintes políticas de senha são implementadas no sistema:

1. **Requisitos Mínimos**:
   - No mínimo 8 caracteres
   - Pelo menos uma letra maiúscula
   - Pelo menos um número
   - Pelo menos um caractere especial

2. **Armazenamento Seguro**:
   - Senhas são armazenadas usando bcrypt através do Supabase Auth
   - Nunca armazenamos senhas em texto plano
   - Cada usuário possui um salt único para o hash de senha

3. **Recuperação de Senha**:
   - O sistema implementa recuperação de senha baseada em links enviados por email
   - Links de recuperação são válidos por tempo limitado
   - Novas senhas devem seguir os mesmos requisitos de segurança

4. **Bloqueio por Tentativas**:
   - Após múltiplas tentativas falhas, o acesso é bloqueado temporariamente
   - Implementamos atraso progressivo entre tentativas

5. **Atualizações de Senha**:
   - Validações de segurança são aplicadas na criação e alteração de senhas
   - Senhas comuns e facilmente adivináveis são rejeitadas
   - A alteração de senha requer confirmação da senha atual
