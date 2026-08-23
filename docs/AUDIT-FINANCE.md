# Auditoria técnica — BusinessOS Finance (referência)

**Data:** 2026-08-21  
**Fonte (read-only):** `C:\Users\jgrei\OneDrive\Desktop\BuniseSOS-Finance`  
**Remote:** `https://github.com/joaoreis07/buniseSOS-FINANCE.git`  
**Escopo:** FASE 1 — nenhuma alteração foi feita no Finance.

---

## 1. Visão geral do Finance

Produto SaaS multi-tenant focado em gestão financeira, com CRM operacional limitado (clientes + vendas + parcelas).

### Stack validada

| Camada | Tecnologia |
|---|---|
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (New York), Lucide, Motion, Sonner |
| Dados | Prisma 6 + PostgreSQL 16 (Docker Compose) |
| Auth | Auth.js v5 (`next-auth` beta) — Credentials + JWT |
| Forms/API | Zod, React Hook Form, TanStack Query/Table |
| Charts/PDF | Recharts, pdfmake |
| Package manager | pnpm 9.15.9 |

### Módulos existentes (`src/modules`)

`auth`, `app-shell`, `customers`, `crm`, `sales`, `finance`, `dashboard`, `reports`, `business-reports`, `calendar`, `agenda`, `settings`, `notifications`, `billing` (Asaas), `platform-admin`, `insights`, `marketing`

### Domínio no Prisma (resumo)

- **Identidade:** User, Account, Session, VerificationToken, Membership, Company, CompanySettings
- **Financeiro:** Category, Transaction, Sale, SaleItem, Installment, InstallmentPayment
- **Clientes:** Customer
- **CRM schema parcial:** Pipeline, Lead, Opportunity, Activity (enums presentes; UI de funil completa **não** aparece como módulo maduro)
- **Plataforma:** AuditLog, SystemLog, Notification, FeatureFlag
- **Billing SaaS:** Plan, SubscriptionStatus, Stripe fields, FeatureKey

### Roles atuais

`ADMIN` | `MANAGER` | `EMPLOYEE`

Permissões centralizadas em `src/shared/lib/rbac.ts` (ex.: `finance:manage`, `customers:view`).

### Multi-tenant

- `companyId` em praticamente todos os recursos
- Soft delete via `deletedAt`
- Helpers: `tenant.ts`, `tenant-fk.ts`, `notDeletedFilter`
- JWT carrega `companyId` + `role` + `sessionVersion`

---

## 2. O QUE REUTILIZAR (padrões / ideias)

Reutilizar como **padrão arquitetural**, não como cópia cega do repositório.

| Item | Por quê |
|---|---|
| Organização `src/modules/*` + `src/shared/*` | Domínios claros, baixo acoplamento |
| Auth.js Credentials + JWT com `companyId`/`role` | Já validado em produção |
| `sessionVersion` para invalidar sessões | Segurança prática |
| Matriz RBAC centralizada (`PERMISSIONS` + `hasPermission`) | Evita auth espalhada |
| Prisma + PostgreSQL + soft delete + índices por `companyId` | Base sólida multi-tenant |
| Padrão repository/service/schema/action/dto por módulo | Consistência e testabilidade |
| Validação Zod nas borders (actions/APIs) | Contratos explícitos |
| shadcn/ui + Tailwind 4 + aliases `@/shared/components` | UI reutilizável |
| AuditLog / SystemLog | Rastreabilidade |
| Scripts `db:verify*` / smoke | Cultura de verificação de tenant/RBAC |
| Rate limiting em auth | Proteção básica |
| `.env.example` + Docker Compose para Postgres | Onboarding local previsível |

---

## 3. O QUE ADAPTAR

| Origem no Finance | Adaptação no One |
|---|---|
| Roles `ADMIN/MANAGER/EMPLOYEE` | Expandir para `ADMIN`, `MANAGER`, `SALES`, `FINANCE`, `INVENTORY` (+ permissões granulares) |
| `Customer` + ficha financeira | Evoluir para CRM completo (histórico comercial + atividades) |
| `Sale` / `SaleItem` / parcelas | Módulo comercial com orçamentos, pedidos, status e integração estoque/financeiro |
| `Transaction` / categorias / fluxo | Financeiro **próprio** do One, orientado a eventos de outros módulos |
| Dashboard financeiro | Dashboard empresarial (CRM + vendas + estoque + financeiro) com filtro por permissão |
| Feature flags por plano | Reavaliar modelo comercial do One (não copiar Asaas/Stripe às cegas) |
| CRM enums Lead/Opportunity/Activity | Completar domínio (responsável, probabilidade, funil oficial, tarefas) |
| App shell / nav | Navegação multi-módulo do One |
| Design system / brand | Nova identidade BusinessOS One (não reutilizar assets/marca Finance sem decisão) |

---

## 4. O QUE CRIAR DO ZERO

| Domínio | Motivo |
|---|---|
| Leads / oportunidades / funil / atividades (produto completo) | No Finance o schema existe, mas o produto não entrega CRM completo |
| Produtos e serviços (SKU, barcode, custo, preço, margem, imagens) | Ausente |
| Estoque (saldo, movimentações, mínimo, auditoria) | `FeatureKey.inventory` existe; módulo real não |
| Orçamentos / pedidos e-commerce | Ausente |
| E-commerce (loja, carrinho, checkout, cupons, frete) | Ausente |
| DRE integrado à operação do One | Precisa de modelo contábil próprio alinhado ao financeiro do One |
| Integração entre módulos (eventos de domínio) | Finance acopla venda→parcela→transação no próprio escopo; One precisa de orquestração multi-domínio |
| Banco, migrations, deploy, `.env` e domínio do One | Isolamento obrigatório |
| RBAC estendido e testes de isolamento por módulo | Matriz maior que a do Finance |

---

## 5. O QUE NÃO TOCAR / NÃO REUTILIZAR

### Não tocar (Finance protegido)

- Qualquer arquivo em `buniseSOS-FINANCE`
- Migrations do Finance
- Banco `businessos_finance`
- Deploy/produção/Vercel/config do Finance
- Contas demo, billing Asaas e webhooks do Finance

### Não reutilizar no One (copiar seria risco ou acoplamento)

| Item | Motivo |
|---|---|
| Migrations SQL do Finance | Histórico acoplado ao produto antigo |
| `DATABASE_URL` / container / volume / porta 5432 | Colisão e risco de dados |
| Módulo `billing` Asaas + webhooks | Específico do comercial do Finance |
| `platform-admin` e lista `PLATFORM_ADMIN_EMAILS` | Avaliar depois; não copiar cedo |
| Demo accounts embutidas no build de produção | Revisar política do One |
| Branding, landing e copy do Finance | Produto diferente |
| Schema CRM “meio pronto” sem redesenho | Evitar herdar limitações (ex.: Opportunity sem probabilidade/responsável) |
| Dependência runtime do monorepo/código do Finance | Produtos devem permanecer desacoplados |

---

## 6. Lacunas e riscos observados no Finance (para o One evitar)

1. **CRM incompleto:** modelos Lead/Opportunity/Activity sem produto completo aparente.
2. **RBAC estreito:** `EMPLOYEE` muito limitado; One precisa papéis por domínio.
3. **SaleItem sem ProductId:** itens são descritivos — One deve ligar a catálogo/estoque.
4. **Financeiro centrado em Transaction + Installment:** funciona para Finance; One precisa de eventos entre módulos sem duplicar lançamentos.
5. **Feature flags com chaves futuras (`inventory`):** não implementar flags antes do domínio existir.
6. **Docker na mesma porta 5432:** o One **nasce separado** do Finance. Nesta máquina: Finance=`5432`, Odonto=`5433`, One=`5434`.

---

## 7. Decisão para as próximas fases

1. **FASE 2:** fundação técnica do One (já iniciada neste repositório).
2. **FASE 3:** autenticação + empresa + membros + RBAC expandido.
3. Só então CRM (FASE 4) e demais módulos.

Critério permanente: **segurança > estabilidade > arquitetura > funcionalidade > velocidade**.
