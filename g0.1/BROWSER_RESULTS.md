# G0.1 — Teste em navegador no ambiente isolado (2026-11-03, ~21:05 UTC)

## Resultado: 14 de 14 verificações passaram (validação **local**)

Ambiente: cópia do app em `/tmp/fe` com os arquivos de `g0.1/candidate/src` sobrepostos byte a byte (conferido com `cmp`), servida em 127.0.0.1:8091. Ela fala com o gateway local 127.0.0.1:58000 (Auth v2.197.0, PostgREST, banco com o esquema completo + G0.1, funções candidatas `get_user_profile`, `create_profile`, `create-user`, `manage-user`). Navegador: Chromium headless 1280×1800, Playwright (`tests/browser/g01_browser.py`). Contas fictícias `@example.invalid`.

Única diferença em relação ao candidato, só nesta cópia: a política de segurança do app (CSP em `SecurityHeaders.tsx`) libera `http://127.0.0.1:58000` no lugar de `https://*.supabase.co` (`tests/browser/isolated-only-csp.diff`). **Não faz parte da entrega.**

| # | Verificação | Resultado |
|---|---|---|
| B01 | Login de administrador | vai para `/painel` |
| B02 | Admin abre tela de entregador | permitido (por projeto: só o papel entregador é restrito) |
| B03 | Admin vê dados da própria empresa | cliente da empresa A visível |
| B04 | Logout | volta para `/login` |
| B05 | Rota protegida depois do logout | volta para `/login` |
| B06 | Troca para admin de outra empresa | dados da empresa A **não** reaparecem; cliente da empresa B visível |
| B07 | Login de entregador | vai para `/entregador/entregas` |
| B08 | Entregador tenta rota administrativa | redirecionado para `/entregador/entregas` |
| B09 | Falha de rede na verificação de perfil | sem acesso; mensagem "Não foi possível verificar seu acesso. Tente novamente." |
| B10 | Nova tentativa após a rede voltar | chega a `/entregador/entregas` |
| B11–B12 | Perfil inativo | bloqueado no login e na rota do entregador |
| B13 | Perfil ausente | bloqueado: "Seu cadastro precisa de revisão administrativa." |
| B14 | Nenhuma requisição do app saiu do loopback | ok (bloqueio ativo; só o script externo do editor foi barrado) |

Conferência no banco depois do teste: o perfil inativo continua inativo e o perfil ausente continua ausente. Nenhum papel foi criado ou promovido.

Observação: para perfil inativo, a mensagem é genérica ("Não foi possível verificar seu acesso"). Ela não revela o motivo, mas o usuário não sabe que deve procurar o administrador.

## Incidente durante o teste (registrado)
Na primeira execução, a cópia herdou variáveis de ambiente do sandbox e enviou **tentativas de login com e-mails fictícios inexistentes ao Auth do Cloud**. Todas falharam ("e-mail ou senha incorretos"). Nenhuma conta, dado ou configuração foi criado ou alterado. Correção: as variáveis passaram a ser forçadas para o loopback, e o navegador agora aborta qualquer requisição fora de 127.0.0.1. O app só aceitou o gateway local depois do ajuste de CSP, o que mostra que a política de produção barra destinos não autorizados.

## Local × gateway gerenciado do Cloud
- **Validado localmente:** Auth (mesma versão do Cloud), banco, RPC, políticas, funções candidatas e frontend candidato.
- **Não validado:** o gateway gerenciado das funções do Cloud (verificação de JWT na borda, CORS, limites, variáveis injetadas, versão do runtime Deno). O proxy local não reproduz esse comportamento.
- **Bloqueio concreto:** para executar no gateway gerenciado, as funções precisam estar em `supabase/functions/`, que implanta automaticamente no backend compartilhado com produção (proibido nesta etapa). A alternativa é um draft com backend próprio, mas no draft anterior o gateway retornou 503. Além disso, há neste momento uma manutenção programada do backend Lovable Cloud em andamento (https://status.lovable.dev).
- **Como verificar:** depois da manutenção, criar um draft com backend isolado, colocar ali as quatro funções candidatas sem aceitar o draft, e repetir `live.test.ts` (com `SUPABASE_URL` do draft) e `g01_browser.py` (com a URL de preview do draft). Critério: os mesmos 21 + 14 resultados, mais `verify_jwt` conferido.
