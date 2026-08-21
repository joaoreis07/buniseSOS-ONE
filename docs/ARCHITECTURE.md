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

## Stack inicial

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui (a adicionar na FASE 2)
- Prisma + PostgreSQL 16 (Docker, porta **5433**)
- Auth.js (FASE 3)
- Zod (+ React Hook Form / TanStack quando necessário)
- Recharts quando houver dashboards

## Estrutura de pastas

```text
src/
├── app/                      # Rotas Next.js (App Router)
├── modules/
│   ├── auth/
│   ├── crm/
│   ├── sales/
│   ├── products/
│   ├── inventory/
│   ├── finance/
│   ├── dre/
│   ├── ecommerce/
│   └── dashboard/
└── shared/
    ├── db/                   # Prisma client
    ├── permissions/          # RBAC
    ├── tenant/               # Contexto e asserts de tenant
    ├── validation/
    ├── repositories/
    ├── ui/                   # design system / shadcn
    └── utilities/
```

Cada módulo tende a evoluir com:

```text
actions/ | services/ | repositories/ | schemas/ | dto/ | components/
```

## Multi-tenant

```text
Company
 ├── Membership (User + Role)
 ├── Customers / Leads / ...
 ├── Products / Inventory / ...
 └── Finance / DRE / ...
```

Regras:

- Toda query de negócio filtra por `companyId`
- FKs cross-tenant são rejeitadas (padrão `assert*BelongsToTenant`)
- Soft delete com `deletedAt`

## RBAC (alvo)

| Role | Escopo inicial |
|---|---|
| ADMIN | Acesso completo |
| MANAGER | Gerencial amplo |
| SALES | CRM + vendas |
| FINANCE | Financeiro + DRE |
| INVENTORY | Produtos + estoque |

Permissões no formato `recurso:acao` (ex.: `crm:manage`, `finance:view`), centralizadas em `src/shared/permissions`.

## Dados

- Banco: `businessos_one`
- URL local: `postgresql://businessos:businessos@localhost:5433/businessos_one`
- Migrations **novas**, criadas neste repositório
- Seed próprio (quando existir)

## Integração entre módulos (futuro)

Preferir eventos/serviços de aplicação:

```text
Venda concluída → baixa estoque → gera conta a receber → atualiza DRE/dashboard
```

Evitar duplicidade de lançamentos manuais.

## Relação com o Finance

```text
Finance  = app + DB + deploy próprios
One      = app + DB + deploy próprios
```

Integração eventual: API formal — nunca DB compartilhado.

## Fases

Ver `docs/ROADMAP.md`. Fundação atual cobre FASE 0 (repo/ambiente) e inicia FASE 2 (scaffold). Auth completa = FASE 3.
