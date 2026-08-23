# BusinessOS One

Plataforma completa para gerenciar a empresa em um só lugar: CRM, vendas, produtos, estoque, financeiro, DRE, e-commerce e dashboard.

> **Produto independente** do [BusinessOS Finance](https://github.com/joaoreis07/buniseSOS-FINANCE.git). Repositórios, bancos e deploys separados. Ver `docs/PROTECTION.md`.

## Status

- **FASE 0/1** — concluídas (proteção + auditoria)
- **FASE 2/3** — concluídas (fundação + Auth.js + tenant + RBAC)
- **Próxima:** FASE 4 — CRM

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma 6 + PostgreSQL 16 (Docker, porta host **5434**)
- Auth.js (Credentials + JWT)
- Zod

## Setup

```bash
npm install
cp .env.example .env
npm run db:up
npx prisma migrate deploy
npm run db:verify
npm run verify:foundation
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Isolamento do banco

| | Finance | One |
|---|---|---|
| DB | `businessos_finance` | `businessos_one` |
| Porta | `5432` | `5434` |
| Container | `businessos-postgres` | `businessos-one-postgres` |

## Documentação

| Doc | Conteúdo |
|---|---|
| `docs/PROTECTION.md` | Regras para não alterar o Finance |
| `docs/AUDIT-FINANCE.md` | Reutilizar / Adaptar / Criar / Não tocar |
| `docs/ARCHITECTURE.md` | Arquitetura Auth/tenant/RBAC |
| `docs/ROADMAP.md` | Fases do produto |
| `docs/ISOLATION-CHECK.md` | Checklist de isolamento |
| `docs/CONTRIBUTING.md` | Branches e commits |
