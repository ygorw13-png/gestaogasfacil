# Implantação G1 012 — fluxo de entregas (12/11/2026)

Aplicado no Cloud como `drizzle/migrations/0011_g1_012_fluxo_entregas.sql`, idêntico a `g1/candidate/sql/012_fluxo_entregas.sql`.

## Antes de aplicar
- Cópia de segurança `pg_dump -Fc` do esquema public: `/mnt/documents/.lovable/backups/gasfacil_antes_012_20261112T1048Z.dump`.
  Restaurada no banco descartável sem erros; contagens iguais ao Cloud (143 pedidos R$ 7.290,00; 54 promissórias R$ 870,00; 11 clientes; 211 movimentos; 0 recebimentos).
- Ensaio do 012 sobre a cópia restaurada: aplicou sem erro, nenhum pedido alterado.

## Depois de aplicar
- Mesmas contagens; 0 eventos de entrega; 0 datas previstas preenchidas; 5 funções e 4 gatilhos novos.
- Nenhuma entrega real aberta com previsão para hoje ou ontem (o fechamento de hoje não fica bloqueado).

## Regras
- Modalidade: `origem_venda` 'pedido'/'online' = entrega; 'portaria'/'rua' = balcão/retirada/rua. Nada reclassificado.
- Data da entrega = `entrega_prevista` ou o dia (Bahia) da criação. Lista padrão: hoje + atrasadas abertas; agendadas à parte.
- Fechamento total bloqueado no banco (gatilho em `fechamentos_caixa` tipo total e na marca de fechamento da portaria) enquanto houver entrega aberta com data no dia do fechamento ou no anterior; mesma trava consultiva por empresa para quem cria/reabre/reagenda entrega.
- Aceite só pelo entregador (RPC). Reatribuição exige motivo, zera aceite e não move estoque, exceto com transferência física registrada (carga A −, carga B +).
- Conclusão pela portaria exige forma, valor (salvo a prazo) e cascos explícitos; divergência segue a regra existente.
- Registros antigos: "Revisão necessária"; só o administrador regulariza (volta à fila ou atribui por ID) com motivo e histórico; cancelar segue pela reversão.

## Testes (dados fictícios, banco descartável)
- SQL entregas 012: 72/72. Regressão: reversão 011 67/67, caminhos 010 43/43, acerto 008 43/43, regressão 010 14/14, integração 40/40, permissões 69/69, carga 007 31/31, portaria 006 38/38, segurança 26/27 (mesma falha de base anterior).
- Navegador isolado `g1/tests/browser/g1_012_browser.py`: 24/24.
- Unitário `src/lib/__tests__/entregas.test.ts`: 8/8.

## Registros antigos que pedem decisão do administrador (8)
Todos com entregador anotado como colaborador (sem conta no app), sem carga e sem aceite:
12/08 em rota: Vanessa (#2703A62A), Tuca (#51B7B064), Zeu Mercadinho (#D93CDBAF), Carlinhos Almir (#795A0619), Avani (#77A91672), Ygor Wesley (#C780BA80);
12/08 atribuído: Gilson do Bar (#88544F69); 09/09 atribuído: Ygor Wesley (#D6E51EBE).
Não bloqueiam o fechamento de hoje (datas fora de hoje/ontem).
