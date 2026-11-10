# Architecture rules

- G0.1 release candidates live under `g0.1/candidate/`, outside active `src/` and `supabase/`, because this project's backend is shared with production and managed functions deploy automatically. Do not promote candidates without explicit production approval.
- G0.1 tests use only fictional fixtures and a disposable loopback PostgreSQL cluster; never use the production client or operational records as fixtures.
- Candidate authentication uses one session coordinator for initialization, refresh, manual login and events, because generation checks must precede accepting session identity and duplicate verification must share its result.
- G1 backend candidates (SQL) live under `g1/candidate/sql/` and are applied only to the disposable loopback cluster (`g1/tests/sql/setup_cluster.sh`); production contingency is a containment file that keeps the security blocks, never a rollback that reopens them (rollbacks are lab-only), because the Cloud backend is shared with production.
- Controlled actions (delivery transitions, cargo, receipts, admin corrections) are SECURITY DEFINER RPCs that take an idempotency key and lock the affected row; direct table writes are blocked by triggers unless `g1.acao_controlada` is set inside such an RPC.
- Order value reads go through `src/lib/orderMetrics.ts` (`orders.price` is the sale total, never multiplied by quantity), so dashboard, reports and cashier agree.
- Screens call G1 controlled actions only through `src/lib/g1/acoes.ts`, gated by `VITE_G1_ACOES=on`, because the published database lacks those RPCs until production approval; offline-queued actions must carry their idempotency key in the payload.
