# BusinessOS One

Plataforma para gerenciar a empresa em um só lugar: CRM, vendas, produtos, estoque, financeiro, compras, comunicações, equipe, documentos e dashboard.

> **Produto independente** do [BusinessOS Finance](https://github.com/joaoreis07/buniseSOS-FINANCE.git). Repositórios, bancos e deploys separados. Ver `docs/PROTECTION.md`.

## Status

Fases 0–16 concluídas (estoque, vendas, financeiro interno, compras, relatórios, CRM, comunicações, equipe, configurações, documentos, preparação para produção e cobrança SaaS via Asaas).

A cobrança da **assinatura do BusinessOS One** (Asaas) é independente do **financeiro interno** da empresa (vendas e parcelas). O painel conjunto Finance/Odonto/One fica para uma fase posterior.

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
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Crie a primeira empresa em `/register`. O seed não contém credenciais reais.

### Isolamento do banco

| | Finance | One |
|---|---|---|
| DB | `businessos_finance` | `businessos_one` |
| Porta | `5432` | `5434` |
| Container | `businessos-postgres` | `businessos-one-postgres` |

## QA

```bash
npm run typecheck
npm run lint
npm run build
npm run db:verify

npm run verify:inventory
npm run verify:sales
npm run verify:finance
npm run verify:purchases
npm run verify:reports
npm run verify:crm
npm run verify:communications
npm run verify:team
npm run verify:settings
npm run verify:documents
npm run verify:production
npm run verify:billing
```

Os scripts `verify:*` recusam o banco do Finance e `NODE_ENV=production`.

## Deploy

Ver `docs/DEPLOY.md` (variáveis, migrations, health check, backup).

Health check: `GET /api/health` → `{ "status": "ok" }`.

## Documentação

| Doc | Conteúdo |
|---|---|
| `docs/DEPLOY.md` | Produção, env, backup |
| `docs/PROTECTION.md` | Regras para não alterar o Finance |
| `docs/AUDIT-FINANCE.md` | Reutilizar / Adaptar / Criar / Não tocar |
| `docs/ARCHITECTURE.md` | Arquitetura Auth/tenant/RBAC |
| `docs/ROADMAP.md` | Fases do produto |
| `docs/ISOLATION-CHECK.md` | Checklist de isolamento |
| `docs/CONTRIBUTING.md` | Branches e commits |
