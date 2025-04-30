
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
