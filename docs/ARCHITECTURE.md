# Arquitetura inicial — BusinessOS One

## Posicionamento

> BusinessOS One — sua empresa inteira em um só lugar.

Plataforma multi-tenant com CRM, vendas, produtos, estoque, financeiro, DRE, e-commerce, relatórios e dashboard — **independente** do BusinessOS Finance.

## Princípios

1. Domínios em `src/modules/*` com responsabilidades claras
2. Infra compartilhada em `src/shared/*` (auth, db, permissions, validation, ui)
3. Isolamento por `companyId` em todo recurso empresarial
4. Autorização centralizada (RBAC), nunca espalhada
5. Validação na borda (Zod)
6. Soft delete + auditoria desde a fundação
7. Sem acesso direto ao banco do Finance

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (`src/shared/ui`)
- Prisma 6 + PostgreSQL 16 (Docker)
- Auth.js (Credentials + JWT)
- Zod + React Hook Form

## Estrutura de pastas

```text
src/
├── app/                      # Rotas Next.js (App Router)
│   ├── api/auth/[...nextauth]
│   ├── login|register|forgot-password|reset-password|invite
│   └── app/                  # Área autenticada (/app)
├── modules/
│   ├── auth/                 # schemas, services, actions, components
│   ├── app-shell/            # sidebar, header, nav
│   ├── crm/ …                # placeholders de domínio
└── shared/
    ├── auth/                 # NextAuth config + session helpers
    ├── db/                   # Prisma client
    ├── permissions/          # RBAC (hasPermission / can)
    ├── tenant/               # asserts e filtros de tenant
    ├── audit/                # AuditLog / SystemLog
    ├── ui/                   # shadcn
    └── utilities/
```

## Auth.js e sessão

- Strategy: **JWT** (30 dias), com `sessionVersion` no User
- Login Credentials valida senha (bcrypt) + membership ativo
- JWT carrega `companyId`, `role`, `sessionVersion`
- Callbacks revalidam membership e invalidam token se:
  - membership removido/soft-deleted
  - `sessionVersion` divergente (logout forçado / reset de senha)
- Tenant **nunca** vem confiado do client: usa sessão autenticada (`requireSession` / `requirePermission`)

## Multi-tenant

```text
Company
 ├── Membership (User + Role)
 ├── CompanySettings
 ├── Invite
 └── AuditLog / SystemLog
```

Regras:

- Toda query de negócio filtra por `companyId` da sessão
- Soft delete com `deletedAt`
- Cadastro cria User + Company + Membership(ADMIN) + CompanySettings em transação

## RBAC

| Role | Escopo |
|---|---|
| ADMIN | `*` (acesso total) |
| MANAGER | Gerencial amplo (inclui settings) |
| SALES | CRM + vendas (+ produtos view) |
| FINANCE | Financeiro + DRE |
| INVENTORY | Produtos + estoque |

Permissões no formato `recurso:acao`, em `src/shared/permissions/rbac.ts`.

Proteção em camadas:

1. Middleware: `/app/*` exige JWT ativo
2. Server Components / actions: `requirePermission(...)`
3. Sidebar: filtra itens com `can(role, permission)` (somente UX)

## Middleware e rotas

- Públicas de auth: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/invite`
- Protegidas: `/app/**`
- Usuário autenticado em página de auth → redirect `/app`

## Dados

- Banco: `businessos_one`
- URL local: `postgresql://businessos:businessos@localhost:5434/businessos_one`
- Container: `businessos-one-postgres`
- Migration inicial: `prisma/migrations/20260823232550_init_auth_tenant`
- Migrations **novas**, criadas neste repositório (nunca do Finance)

## Relação com o Finance

```text
Finance  = app + DB + deploy próprios (porta 5432)
One      = app + DB + deploy próprios (porta 5434)
```

Integração eventual: API formal — nunca DB compartilhado.

Ver `docs/PROTECTION.md` e `docs/ISOLATION-CHECK.md`.

## Verificação

```bash
npm run db:up
npm run db:verify
npm run verify:foundation
npm run verify:customers
npm run typecheck
npm run lint
npm run build
```

## CRM — Clientes (FASE 4.1)

- Model `Customer` multi-tenant (`companyId` da sessão)
- Soft delete (`deletedAt`)
- Camadas: `schemas` → `repositories` → `services` → `actions` → UI
- Permissões: `crm:view` (listar/detalhe), `crm:manage` (criar/editar/excluir)
- FINANCE possui `crm:view` para consulta; INVENTORY não acessa CRM nesta fase
- Rotas: `/app/crm`, `/app/crm/new`, `/app/crm/[id]`, `/app/crm/[id]/edit`
- Detalhe preparado para histórico futuro (hoje: AuditLog)

## Fases

Ver `docs/ROADMAP.md`.
