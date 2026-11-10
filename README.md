# GásFácil

Gestão de distribuidora de gás e água (React + Vite + TypeScript, backend Lovable Cloud).

**Estado atual, decisões, comandos e pendências: [`HANDOFF_CLAUDE.md`](./HANDOFF_CLAUDE.md).**
Regras de arquitetura: [`AGENTS.md`](./AGENTS.md).

```bash
bun install          # ou npm ci
cp .env.example .env # preencher (sem segredos privados no frontend)
bun run dev          # http://localhost:8080
```

Atenção: o backend é compartilhado entre preview e produção. Candidatos de banco e funções ficam em `g0.1/` e `g1/`
e só são aplicados em bancos descartáveis locais até aprovação explícita de produção.
