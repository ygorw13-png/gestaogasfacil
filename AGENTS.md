# Architecture rules

- G0.1 release candidates live under `g0.1/candidate/`, outside active `src/` and `supabase/`, because this project's backend is shared with production and managed functions deploy automatically. Do not promote candidates without explicit production approval.
- G0.1 tests use only fictional fixtures and a disposable loopback PostgreSQL cluster; never use the production client or operational records as fixtures.
- Candidate authentication uses one session coordinator for initialization, refresh, manual login and events, because generation checks must precede accepting session identity and duplicate verification must share its result.
- G1 backend candidates (SQL) live under `g1/candidate/sql/` and are applied only to the disposable loopback cluster; each ships with a rollback file, because the Cloud backend is shared with production.
- Order value reads go through `src/lib/orderMetrics.ts` (`orders.price` is the sale total, never multiplied by quantity), so dashboard, reports and cashier agree.
