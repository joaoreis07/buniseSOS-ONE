# Roadmap oficial — BusinessOS One

Ciclo por fase: **Analisar → Planejar → Implementar → Testar → Corrigir → Validar → Documentar → Próxima**.

Uma fase só fecha quando backend, banco, validações, permissões, integrações relevantes e testes reais funcionam — não apenas UI.

| Fase | Nome | Status |
|---|---|---|
| 0 | Proteção e planejamento | Concluída |
| 1 | Auditoria do Finance (read-only) | Concluída (ver `AUDIT-FINANCE.md`) |
| 2 | Fundação (Next, Prisma, modular, RBAC base, erros, logging) | Concluída |
| 3 | Autenticação e empresa | Concluída (fundação) |
| 4 | CRM | Pendente — **próxima** |
| 5 | Produtos e serviços | Pendente |
| 6 | Estoque | Pendente |
| 7 | Vendas | Pendente |
| 8 | Financeiro do One | Pendente |
| 9 | DRE | Pendente |
| 10 | Dashboard | Pendente |
| 11 | E-commerce | Pendente |
| 12 | Integração entre módulos | Pendente |
| 13 | Relatórios | Pendente |
| 14 | Segurança | Pendente |
| 15 | QA | Pendente |
| 16 | Deploy independente | Pendente |
| 17 | Lançamento | Pendente |

## O que a FASE 2/3 entregou

- PostgreSQL isolado (`businessos_one`, porta host `5434`)
- Migration inicial Auth/tenant
- Auth.js (cadastro, login, logout, reset, convite)
- Sessão JWT com `companyId` + `role` + `sessionVersion`
- Multi-tenant + RBAC centralizado
- Middleware e rotas `/app` protegidas
- App shell (sidebar/header) + shadcn/ui
- Scripts `db:verify` e `verify:foundation`

## Próximo passo imediato

Iniciar **FASE 4 — CRM** (clientes, leads, oportunidades, funil, atividades), sem alterar o BusinessOS Finance.
