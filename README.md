# BusinessOS One

Plataforma completa para gerenciar a empresa em um só lugar: CRM, vendas, produtos, estoque, financeiro, DRE, e-commerce e dashboard.

> **Produto independente** do [BusinessOS Finance](https://github.com/joaoreis07/buniseSOS-FINANCE.git). Repositórios, bancos e deploys separados. Ver `docs/PROTECTION.md`.

## Status

- **FASE 0** — repositório e ambiente local
- **FASE 1** — auditoria do Finance (read-only) → `docs/AUDIT-FINANCE.md`
- **FASE 2** — fundação em andamento (scaffold Next.js + Prisma + RBAC/tenant base)

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL 16 (Docker, porta **5433**)
- Zod
- Auth.js (próxima fase)

## Setup

```bash
# Dependências
npm install

# Variáveis de ambiente
cp .env.example .env

# PostgreSQL do One (NÃO usa o banco do Finance)
docker compose up -d

# Prisma client
npx prisma generate

# Migration (quando o Docker estiver saudável)
npx prisma migrate dev --name init_foundation
```

Desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Isolamento do banco

| | Finance | One |
|---|---|---|
| DB | `businessos_finance` | `businessos_one` |
| Porta | `5432` | `5433` |

## Documentação

| Doc | Conteúdo |
|---|---|
| `docs/PROTECTION.md` | Regras para não alterar o Finance |
| `docs/AUDIT-FINANCE.md` | Reutilizar / Adaptar / Criar / Não tocar |
| `docs/ARCHITECTURE.md` | Arquitetura inicial |
| `docs/ROADMAP.md` | Fases oficiais |
| `docs/CONTRIBUTING.md` | Branches e commits |

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` / `start` | Produção |
| `npm run lint` / `typecheck` | Qualidade |
| `npm run db:up` / `db:down` | Docker Postgres do One |
| `npm run db:generate` / `db:migrate` / `db:studio` | Prisma |
