# G1 — Lote 3: telas ligadas às ações controladas (10/11/2026)

Nada aplicado em produção, nenhuma publicação, nenhum draft aceito. O preview continua no caminho atual:
as telas só usam as ações novas com `VITE_G1_ACOES=on`, ligado apenas na cópia isolada.

## Decisões aplicadas
- **A** — operador não cancela, não altera preço, não estorna. Só administrador, com motivo e auditoria (`admin_corrigir_pedido`).
- **C** — troca de entregador só por ID, explícita, com motivo (`reatribuir_entrega`). Históricos não são associados nem alterados.
- **D** — origem física real: produto que sai da portaria vai para a carga **antes** do consumo (também na entrega avulsa:
  opção "O produto sai agora da portaria" na atribuição). Portaria baixa só na transferência; a entrega baixa só da carga.
- **B (pendente)** — nenhum estorno automático. Cancelar venda concluída, trocar produto/quantidade/forma de venda lançada e
  mudar preço com pagamento registrado ficam **bloqueados** com explicação.

## SQL (candidato, `g1/candidate/sql/`)
| Arquivo | O que faz |
|---|---|
| `004_integracao_telas.sql` | transferência portaria→carga, atribuição com retirada, reatribuição, venda na rua com ID, conclusão pela portaria, venda de balcão em uma ação (venda+estoque+recebimento/promissória), divergências, correção admin conservadora |
| `004_contencao.sql` | **substitui** `003_contencao.sql` (agora só laboratório): pausa as ações do entregador sem reabrir gravação direta; a portaria conclui pela ação controlada, mantendo carga, dívidas e recebimentos consistentes |
| `004_contencao_desfazer.sql` | devolve só as ações controladas do entregador |

## Telas adaptadas (atrás da chave `VITE_G1_ACOES`)
| Tela | Antes | Agora |
|---|---|---|
| App do entregador (aceitar/recusar/entreguei) | gravação direta no pedido | ações controladas; "Entreguei" com chave fixa por pedido (toque duplo = 1 conclusão) |
| Venda na rua | 2 gravações separadas (pedido + promissória) | 1 ação com chave; fila offline reenvia a mesma chave |
| Atribuição / troca de entregador | gravação direta | `atribuir_entrega` (com retirada opcional) / `reatribuir_entrega` com motivo obrigatório |
| Conclusão pela portaria / entregas atrasadas | gravação direta, preço substituído pelo valor recebido | `operador_concluir_entrega`: preço intacto, diferença vira divergência |
| Venda rápida e venda do caixa | pedido + estoque + promissória em passos separados | `venda_portaria` (tudo ou nada); caixa não baixa estoque de novo; lançamento retroativo recusado (sem regra) |
| Cancelar / editar venda | estorno automático de estoque e parceiro | admin com motivo; venda concluída recusada (decisão B) |
| Promissórias | quitação direta sem valor | `receber_promissoria` (parcial, com forma); cobradores por `listar_cobradores` |
| Painel | "recebido" deduzido da forma informada | ver abaixo |

Correção encontrada no teste de navegador: o app do entregador não mostrava "Entreguei" para entregas aceitas pela ação nova (situação `delivering`). Corrigido.

## Painel do dia
Cinco quadros separados: **Vendas concluídas**, **Recebido hoje**, **Saldo a receber**, **Saldo vencido**, **Divergências**.
"Recebido" soma só recebimentos registrados e separa conferido × dinheiro com entregador aguardando acerto.
Sem esse registro (produção atual), aparece **"Não comprovado"** — entrega concluída nunca é tratada como pagamento.
Divergências: valor recebido diferente do preço, venda concluída sem recebimento nem promissória, venda sem forma.

## Verificações executadas (todas em 127.0.0.1, dados fictícios)
| Verificação | Resultado |
|---|---|
| Integração SQL 004 (fluxos, permissões, falhas, reenvio, concorrência, contenção) — banco limpo | **40/40** |
| Permissões 003 com 004 (regra C atualizada: troca só por reatribuição) | **69/69** |
| Segurança 002 com 003+004 | **26/27** — a única diferença é a intencional do lote 2 (entregador só lê as próprias entregas) |
| Testes automáticos de regras (inclui painel) | **18/18** |
| Navegador com backend real isolado (PostgreSQL + PostgREST locais) | **14/14** |

Navegador (B01–B13): isolamento entre empresas; operador recusado ao cancelar; atribuição com retirada (carga +1, portaria −1 na mesma ação);
entregador aceita e conclui com toque duplo (1 recebimento, carga −1, portaria sem segunda baixa, preço intacto);
venda na rua sem carga recusada sem gravar; sem internet fica no aparelho e, ao voltar com reenvio, grava 1 venda e 1 recebimento;
painel com os cinco quadros e R$ 255,00 "com entregador, aguardando acerto"; admin não cancela venda concluída; nenhuma chamada ao backend real.

Observação: as suítes gravam dados; rodar cada uma em banco recém-criado (`reset_com004.sh`). Rodadas em sequência no mesmo banco dão falsos negativos por carga residual.

## Limites desta validação
- Login no ambiente isolado usa um substituto local do serviço de contas (senha fixa de teste, token assinado localmente); o serviço de contas real foi validado na G0.1, não neste lote.
- Avisos em tempo real ficaram desligados na cópia isolada.
- A cópia isolada desativa o redirecionamento para conexão segura e restringe as conexões a 127.0.0.1 (só nela).
- B12 (admin × decisão B) foi verificado chamando a ação diretamente, não pela tela.
- **Gateway hospedado do Cloud continua não verificado** (pendência G0.1).
- A transferência para a carga não confere saldo disponível na portaria (depende da regra de estoque diário).

## Sequência para produção (quando aprovada)
002 → 003 → 004 → publicar frontend com `VITE_G1_ACOES=on` → testes de fumaça. Se o app novo do entregador falhar: `004_contencao.sql` (nunca `003_contencao.sql`).
