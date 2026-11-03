# Architecture rules

- G0.1 release candidates live under `g0.1/candidate/`, outside active `src/` and `supabase/`, because this project's backend is shared with production and managed functions deploy automatically. Do not promote candidates without explicit production approval.
- G0.1 tests use only fictional fixtures and a disposable loopback PostgreSQL cluster; never use the production client or operational records as fixtures.