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

## CRM — Leads (FASE 4.2)

- Model `Lead` multi-tenant com soft delete
- Enums: `LeadOrigin`, `LeadStatus` (NEW → CONTACTED → QUALIFIED / UNQUALIFIED / CONVERTED / LOST)
- Permissões granulares: `crm:leads:view`, `crm:leads:manage`
- ADMIN/MANAGER/SALES gerenciam; FINANCE e INVENTORY sem leads
- Rotas: `/app/crm/leads`, `/app/crm/leads/new`, `/app/crm/leads/[id]`, `/app/crm/leads/[id]/edit`
- `convertedCustomerId` reservado para conversão futura (sem Opportunity nesta fase)
- Verificação: `npm run verify:leads`

## CRM — Oportunidades (FASE 4.3)

- Model `Opportunity` multi-tenant com soft delete
- Estágios: `NEW` | `QUALIFIED` | `PROPOSAL` | `NEGOTIATION` | `WON` | `LOST`
- Vínculos opcionais `leadId` / `customerId` validados no mesmo `companyId`
- Campos: valor estimado, probabilidade (0–100), previsão de fechamento, responsável, notas
- Permissões: `crm:opportunities:view`, `crm:opportunities:manage`
- Rotas: `/app/crm/opportunities` (+ `/new`, `/[id]`, `/[id]/edit`)
- Verificação: `npm run verify:opportunities`

## CRM — Funil (FASE 4.4)

- Board Kanban sobre o model `Opportunity` existente (sem modelagem duplicada)
- Colunas = estágios; cards com nome, vínculo, responsável, valor, probabilidade, previsão
- Move de estágio com `crm:pipeline:manage`, escopo `companyId` e auditoria `OPPORTUNITY_STAGE_MOVE`
- Rota: `/app/crm/pipeline`
- Verificação: `npm run verify:pipeline`

## CRM — Atividades (FASE 4.5)

- Model `Activity` multi-tenant com soft delete
- Tipos: CALL, MEETING, WHATSAPP, EMAIL, TASK, NOTE
- Status: PENDING, COMPLETED, CANCELLED
- Vínculos opcionais a Customer / Lead / Opportunity (ao menos um obrigatório na validação)
- Painel embutido nos detalhes de cliente, lead e oportunidade
- Permissões: `crm:activities:view`, `crm:activities:manage`
- Rotas: `/app/crm/activities` (+ `/new`, `/[id]`, `/[id]/edit`)
- Verificação: `npm run verify:activities`

## CRM — Dashboard (FASE 4.6)

- Indicadores de leads, oportunidades, conversão, atividades e desempenho por estágio/responsável
- Escopo estrito por `companyId` + `crm:dashboard:view`
- Rota: `/app/crm/dashboard`
- Verificação consolidada: `npm run verify:crm`

## Produtos e serviços (FASE 5)

- Models `Product` e `ProductCategory` multi-tenant com soft delete
- Tipos: `PRODUCT` | `SERVICE` (serviço sem estoque futuro)
- Status: `ACTIVE` | `INACTIVE`
- SKU obrigatório e único por empresa (ativos); barcode único quando informado
- Preços de custo/venda ≥ 0; categoria validada no mesmo `companyId`
- Imagem: apenas referência/URL (`imageUrl`) — sem galeria; storage de upload ainda não wired
- Permissões: `products:view|manage`, `categories:view|manage`
  - SALES: visualização; INVENTORY: gestão; FINANCE: sem produtos
- Rotas: `/app/products`, `/new`, `/[id]`, `/[id]/edit`, `/app/products/categories`
- Sem estoque e sem vendas nesta fase
- Verificação: `npm run verify:products`

## Estoque (FASE 6)

- Models `Inventory` (1:1 produto físico/tenant) e `InventoryMovement`
- Tipos: ENTRY, EXIT, ADJUSTMENT, RETURN, LOSS — movimentações imutáveis
- Serviços (`SERVICE`) sem saldo de estoque
- Saldo nunca negativo; ajuste via nova movimentação
- Permissões: `inventory:view`, `inventory:manage`, `inventory:movements`
- Rotas: `/app/inventory`, `/app/inventory/[productId]`, `/app/inventory/[productId]/movements`
- Verificação: `npm run verify:inventory`

## Vendas (FASE 7)

- Models `Sale` e `SaleItem` multi-tenant; item vinculado a `Product` com snapshot de nome, SKU, tipo e preço
- Status: `DRAFT` | `COMPLETED` | `CANCELLED` (PDV conclui atomicamente)
- Formas de pagamento (conceito do Finance, sem parcelas): CASH, PIX, CARD, CARD_CREDIT, CARD_DEBIT, TED, OTHER
- Totais recalculados no servidor (centavos); desconto não gera total negativo
- Serviços não movimentam estoque; produtos físicos geram `EXIT` na conclusão e `RETURN` no cancelamento
- `InventoryMovement.saleId` opcional para rastreio; movimentações continuam imutáveis
- Sem `Installment` / financeiro — FASE 8
- Permissões: `sales:view`, `sales:create`, `sales:manage`, `sales:cancel`
- Rotas: `/app/sales`, `/app/sales/new`, `/app/sales/[id]`
- Verificação: `npm run verify:sales`

## Fases

Ver `docs/ROADMAP.md`.
