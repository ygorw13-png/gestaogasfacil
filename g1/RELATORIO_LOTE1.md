# Relatório do primeiro lote G1 (Etapas 0 e 1) — validação de 04/11/2026

Escopo: eliminar informações fictícias e confirmar, em ambiente isolado, que cada correção se comporta como pedido. Nada foi publicado, nenhuma migração foi aplicada, nenhum registro real foi alterado. Build compilado não foi tratado como teste.

## 1. Como foi validado

| Camada | Ambiente | Dados | Resultado |
|---|---|---|---|
| Testes automatizados (Vitest) | Sandbox, backend simulado no teste | Fictícios | **11/11** (`src/lib/__tests__/g1-etapa1.test.tsx`) |
| Navegador (Playwright) no preview local | Frontend do preview com **todas** as chamadas ao backend interceptadas e respondidas por um backend fictício; qualquer chamada não prevista é bloqueada | Fictícios (empresa, usuário e pedidos inventados para o teste) | **26/26** (`g1/tests/browser/validate.py`) |
| Leituras do banco real | Somente consulta (SELECT) | Reais, sem alteração | Usadas para confirmar como `price` é gravado e o estado dos fechamentos |

Nenhuma escrita chegou ao banco real: o navegador não tinha sessão real (o login automático da conta não foi possível — não existe conta com o seu e-mail no app) e todo tráfego ao backend foi interceptado. Suíte existente do app: todos os arquivos de `src/` passam; os testes de `g0.1/tests` exigem o banco descartável próprio da G0.1 e não foram reexecutados neste lote.

## 2. Resultados por item pedido

| # | Verificação | Resultado | Evidência |
|---|---|---|---|
| 1 | Indicadores e Excel usam mesma empresa, período, estados e interpretação de preço | **Aprovado após correção** | Ambos excluem só cancelados, mesmo período, e agora a mesma regra de valor. Navegador: painel e receita do mês = 505,00 para pedidos fictícios de 250 + 125 + 130 (cancelado de 20 fora). Teste: Excel do dia = indicador do dia. Empresa: ambos consultam com o token do usuário; o isolamento vem das regras do banco (ver Etapa 2). |
| 2 | Falha de consulta = indisponível; ausência real = zero | **Aprovado após correção** | Falha simulada: painel mostra "Indicadores indisponíveis" e nenhum 0,00. Sem vendas: 0,00 e 0 pedidos, sem aviso de falha. Excel com falha não gera planilha. |
| 3 | Pedido com falha não fecha formulário, não imprime, não informa sucesso | **Aprovado após correção** | Falha simulada na gravação: formulário aberto, dados preservados, nenhum recibo gerado, aviso "Erro ao adicionar pedido" exibido. |
| 4 | Pedido salvo imprime o ID persistido | **Aprovado** | Recibo gerado contém o ID devolvido pelo backend (11111111-…); forma de pagamento agora também vai ao recibo. |
| 5 | Valores configurados como zero permanecem zero | **Aprovado após correção** | Entregas (taxa, mínimo, raio), financeiro (imposto) e estoque mínimo exibem 0; salvar estoque mantém 0. |
| 6 | Fechamento parcial = operações até o corte, sem duplicar vendas nem movimentar caixa | **Aprovado após correção**, com regra a confirmar | Parcial gravado: total 375 = só entregues (250 dinheiro + 125 PIX); soma das formas = total; nenhuma outra gravação (caixa/estoque intocados). Cada parcial é o **acumulado do dia até o corte** — confirmar na decisão 10. |
| 7 | Cobradores = cadastros reais da empresa, respeitando permissões | **Aprovado após correção**, com decisão pendente | Lista = colaboradores ativos (filtro no pedido ao banco), com o token do usuário. Regra atual do banco: só admin lê colaboradores, então "user" vê lista vazia (decisão 15). |

## 3. Problemas encontrados pela validação e corrigidos neste lote

| Problema | Impacto | Correção | Arquivos |
|---|---|---|---|
| Painel e Excel multiplicavam o valor por quantidade, mas o valor gravado já é o total | Vendas infladas (2 botijões a 250 apareciam como 500) e divergência com caixa/comissões | Regra única: valor = total gravado | `src/lib/orderMetrics.ts` (novo), `useDashboardData.ts`, `FinanceMetrics.tsx`, `reportDataGenerator.ts` |
| Painel principal ficava carregando para sempre quando a consulta falhava | Falha parecia lentidão | Mensagem "Indicadores indisponíveis" com "Tentar novamente" | `src/pages/Dashboard.tsx` |
| Avisos das telas (erros e confirmações) não apareciam: 83 telas usam um sistema de aviso que não estava montado | Usuário não via erros de gravação nem confirmações | Avisos montados no app | `src/App.tsx` |
| "Nova Promissória" quebrava ao abrir (opção "Não atribuir agora" com valor vazio) | Tela de promissória inutilizável para criar título | Opção com marcador próprio; mesma correção no filtro de motorista das rotas | `CollectorSection.tsx`, `DriverFilter.tsx` |
| Fechamento do dia atual gravava dinheiro/PIX/cartão = 0 (só o total) | Confirmado nos registros de 09/09 (parcial 1.056 e total 1.386 com formas zeradas) | Retrato relido no instante do corte, com divisão por forma; se a leitura falhar, nada é gravado | `CashierClosingForm.tsx` |
| Botão "Gerar PDF" do fechamento usava dados errados | PDF podia sair com valores incorretos | Usa o mesmo retrato do fechamento | `CashierClosingForm.tsx` |
| Estoque mínimo nunca era salvo nem lido (procurava pelo código "P13" num campo de identificador) | Configuração de estoque mínimo sem efeito; tabela vazia em produção | Localiza e grava pelo produto; zero preservado | `src/lib/stockConfig.ts` (novo), `useStockConfiguration.ts`, `useMinStockLevels.ts` |

Correções do lote anterior mantidas: indicadores administrativos reais, Excel com dados reais, cobradores reais, formulário de sistema vazio, `??` para zeros, parcial sem dividir por dois, pedido só confirmado após gravação, erros do dashboard propagados.

## 4. Pendências

- **Endereço `/entrance/cashier`** abre uma tela quebrada (erro de contexto). Não está nos menus; o fechamento real é feito pelo botão "Fechar Caixa" da portaria. Remoção prevista na Etapa 10.
- **Fuso horário:** "hoje" é calculado pelo relógio do aparelho; o saldo da portaria usa a data em UTC. Entre 21h e 24h (Bahia) podem divergir. Etapa 8.
- **Validação com conta real:** não executada — o app não tem conta com o seu e-mail. Para rodar com uma conta real (somente leitura), indique qual conta usar.
- **Gateway gerenciado do Cloud (G0.1):** continua não verificado; cadastro administrativo de colaboradores continua desligado.
- Itens já registrados para etapas seguintes: relatórios de rota demonstrativos, `mockData` de promissórias, configurações sem efeito, unificação de códigos de pagamento.

## 5. Contenção

Todas as mudanças são de tela (frontend) e estão só no preview. Reverter qualquer item = reverter o arquivo listado; não há efeito no banco.
