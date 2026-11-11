# Plano de implantação e de eventual migração (para revisão)

Candidato 009 adicionado em 10/11/2026; depois de 008 e antes da ativação das telas, incluir `009_venda_saldo_portaria.sql`. Validação e limites: `CONTINUIDADE_G1_009.md`.

Nada deste plano foi executado. Qualquer publicação, migração ou mudança de backend depende de aprovação específica do proprietário, depois de revisar a entrega e os resultados dos testes.

## 1. Arquitetura (confirmada após avaliar a base)

- **Aplicativo web responsivo e instalável (PWA)**, uma só base de código:
  - portaria e administração no computador;
  - entregador no celular (layout próprio, fila offline, aviso sonoro, push por VAPID, localização com o app aberto).
- **Não há necessidade concreta de aplicativo nativo hoje.** A única limitação real do PWA é a localização em segundo plano: no iPhone, o PWA não envia posição com o app fechado. Se rastrear o entregador com o app fechado virar requisito, a saída de menor custo é empacotar o mesmo app (ex.: Capacitor), não escrever outro.
- **Backend:** PostgreSQL com RLS, Auth e funções Deno, hoje no Lovable Cloud (Supabase gerenciado pelo Lovable). As regras de negócio críticas estão em funções SQL (`SECURITY DEFINER`, idempotentes, com trava), não na tela.

## 2. Dois movimentos diferentes

| | A. Sair do editor Lovable (objetivo atual) | B. Trocar o backend (só com plano aprovado) |
|---|---|---|
| O que muda | Onde o código é editado, testado e publicado | Onde ficam banco, contas, funções, agendamento e segredos |
| Dados | Ficam onde estão | Precisam ser exportados, restaurados e conferidos |
| Risco | Baixo, se o preview deixar de gravar em produção | Alto: contas de usuário, chaves e agendamento precisam ser refeitos |

### Dependências de backend mapeadas

| Recurso | Onde está | Observação |
|---|---|---|
| Banco | Lovable Cloud | 30 migrações aplicadas; os candidatos 001 e 002–008 estão no repositório |
| Auth | Lovable Cloud | 2 contas. Os IDs são referenciados por `profiles`, `user_roles`, `orders.delivery_person_id`, cargas e recebimentos: numa migração, **os UUIDs têm de ser preservados** |
| Funções Deno | `supabase/functions/` (8) | O Lovable implanta automaticamente: não editar ali sem aprovação |
| Agendamento | `pg_cron` `fechamento-portaria-diario` (`5 3 * * *` UTC) | **Fora das migrações**; depende de `pg_cron` e `pg_net` |
| Push | Segredos `VAPID_*` | Chaves novas invalidam as assinaturas atuais: cada aparelho precisa autorizar de novo |
| WhatsApp | `enviar-whatsapp` usa o gateway de conectores do Lovable (Twilio) ou a Evolution API | Nada configurado hoje. Fora do Lovable, o caminho Twilio-via-Lovable deixa de existir |
| Storage | 0 buckets | Nada a migrar |
| Segredo gerenciado | `LOVABLE_API_KEY` | Só existe no Lovable |

### Alternativas de backend e custo recorrente

Preços conferidos em 10/11/2026 na página oficial do Supabase. Os do Lovable não são publicados como valor fixo.

| Opção | Custo recorrente | Limitações | Observações |
|---|---|---|---|
| **Manter o Lovable Cloud** como backend e desenvolver fora do editor | Plano do Lovable, mais o uso do backend descontado dos "Run credits" ([docs](https://docs.lovable.dev/integrations/cloud)) | O preview grava no banco de produção. A documentação não descreve ambiente de teste separado. Aplicar migrações e funções depende do Lovable | Menor esforço. **É preciso confirmar como aplicar SQL revisado sem usar o editor** |
| **Supabase próprio, plano Pro** | US$ 25/mês por organização, com US$ 10/mês de computação (1 instância Micro), 8 GB de disco, 250 GB de saída, 100 mil usuários ativos e **backup diário com 7 dias**. Projeto extra (ex.: homologação) a partir de US$ 10/mês. **PITR a partir de US$ 100/mês** ([preços](https://supabase.com/docs/pricing)) | Migração do Lovable não é automática: exportar o banco, restaurar, recriar Auth, segredos e serviços externos ([docs Lovable](https://docs.lovable.dev/integrations/cloud)) | Permite produção e homologação separadas, que hoje não existem |
| Supabase gratuito | US$ 0 | **Sem backup** e pausa após 1 semana sem uso ([preços](https://supabase.com/docs/pricing)) | Serve só para teste |
| Supabase auto-hospedado (VPS) | Custo da VPS (não levantado), mais operação própria de backup, atualização e segurança | Exige quem opere o servidor | Não recomendado para o porte atual |
| Hospedagem do frontend (arquivos estáticos) | Normalmente baixa ou gratuita em provedores de sites estáticos (valores não levantados) | O `vite-plugin-pwa` exige HTTPS | Independe da escolha do backend |

**Recomendação para revisão:** fazer A agora. B só vale se o proprietário quiser ambiente de homologação separado e backup sob controle próprio; aí, Supabase Pro com dois projetos (produção e homologação).

## 3. Executar e configurar

```bash
bun install            # ou npm ci (há bun.lockb e package-lock.json)
cp .env.example .env   # NUNCA apontar para o banco publicado em testes; VITE_G1_ACOES=off contra o banco publicado
bun run dev            # http://localhost:8080
bun run build && bun run lint
```

Banco de teste isolado (PostgreSQL 16 ou 17, só em 127.0.0.1, dados fictícios):

```bash
export G1DB=/caminho/fora/do/repo   # os scripts rodam o PostgreSQL como uid 1000
bash g1/tests/sql/reset_com008.sh com_abertura
U="postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable"
python3 g1/tests/sql/run_acerto008.py "$U" teste   # e as demais suítes (ver docs/CHECKLIST_UNICO.md)
```

## 4. Ordem de aplicação (quando aprovada)

1. **Backup** (seção 6) e congelamento: aviso à equipe, nenhum aparelho com lançamento pendente na fila offline (tela `/offline` com zero itens em todos os celulares).
2. G0.1: funções de administração → `001_profile_verification.sql` → funções de perfil (ver `g0.1/PUBLICATION_SEQUENCE.md`).
3. G1, em transações únicas (`psql -1`): `002` → `003` → `004` → `005` → `006` → `007` → `008`.
4. Publicar o frontend desta branch com `VITE_G1_ACOES=on` **na mesma janela**.
5. **Janela:** fora de 21:00–23:59 (Bahia), quando a data UTC e a data Bahia coincidem (o 006 muda a data operacional), e fora do horário de vendas.
6. Primeira operação do dia seguinte: confirmar a abertura da portaria. Sem ela, a saída para a carga é recusada.
7. Testes de fumaça com um usuário de cada papel:
   - venda de balcão (os três tipos);
   - pedido → atribuição com saída da portaria → aceite → conclusão;
   - venda na rua;
   - devolução de sobra;
   - promissória parcial;
   - acerto;
   - painel (os quatro quadros de recebido);
   - permissão negada para o entregador fora do que é dele.

**Ativação coordenada:** o frontend novo com a chave ligada depende das funções 004–008, e o banco com 003 bloqueia as gravações diretas do frontend antigo. Por isso banco e tela sobem juntos.

## 5. Contingência sem reabrir permissões

- Falha no app do entregador: `g1/candidate/sql/004_contencao.sql` pausa as ações do entregador e mantém a operação pela portaria, sem reabrir gravação direta. Para desfazer: `004_contencao_desfazer.sql`.
- **Nunca** usar `002_rollback.sql` nem `003_contencao.sql` em produção: reabrem as permissões vulneráveis.
- **Não** voltar só o frontend para a versão antiga com o banco já migrado: as gravações diretas antigas passam a ser recusadas. Corrigir para frente, ou usar a contenção.
- O 005–008 não tem "desfazer" de produção. A correção vai em uma migração nova, revisada e testada no banco descartável.

## 6. Backup, conferência e restauração

O pacote de código **não é** backup de dados nem de contas.

Antes de qualquer migração:
1. Exportar o banco completo (esquema e dados) pelo meio que o Lovable Cloud oferecer, com autorização do proprietário. Guardar fora da máquina de trabalho, criptografado.
2. **Restaurar o export num PostgreSQL descartável** e rodar a conferência abaixo. Backup que não foi restaurado não está comprovado.
3. Conferência, antes e depois, idêntica nos dois lados:
   - linhas por tabela operacional (`orders`, `clients`, `promissory_notes`, `movimentacoes_portaria`, `fechamentos_caixa`, `despesas`, `colaboradores`, `profiles`, `user_roles`);
   - por dia: quantidade e soma de `orders.price` por status e origem;
   - soma de `value` e `paid_amount` das promissórias por status;
   - soma de `delta_cheios`, `delta_vazios` e `delta_emprestados` por `data_operacao` e produto;
   - vínculos: pedidos com `client_id` inexistente, `profiles` sem `user_roles`, promissórias com `order_id` inexistente (devem dar zero ou a mesma quantidade nos dois lados).
4. **Contas (Auth):** se o export incluir `auth.users` com o hash da senha, os usuários entram com a mesma senha. Se não incluir, cada pessoa redefine a senha. Em qualquer caso, os **mesmos UUIDs** são obrigatórios.
5. **Agendamento:** recriar o `fechamento-portaria-diario` e as extensões `pg_cron` e `pg_net`. Revisar antes a função de fechamento automático: ela usa a data UTC, que está correta no horário agendado, mas o ideal é passar à data Bahia.
6. **Segredos:** recriar `VAPID_*` (de preferência os mesmos valores, para não invalidar as assinaturas de push) e os do WhatsApp, se forem usados.

## 7. Operações offline na transição

- Antes da janela, todos os aparelhos sincronizados e com fila vazia. Lançamentos antigos do caminho sem G1 (inserção direta de pedido) seriam recusados pelo banco migrado.
- Lançamentos de versões anteriores do app não têm o dono registrado. A fila nova pede confirmação antes de enviá-los (não sobem em silêncio).
- Ações controladas na fila levam a chave de reenvio. Reenviar depois da reconexão não duplica, e o servidor revalida permissão, carga e saldo.

## 8. Fontes

- Preços e backup do Supabase: <https://supabase.com/docs/pricing> (consultado em 10/11/2026)
- Lovable Cloud (cobrança, migração para Supabase próprio): <https://docs.lovable.dev/integrations/cloud> (consultado em 10/11/2026)
