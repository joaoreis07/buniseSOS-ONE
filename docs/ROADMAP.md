# Roadmap oficial — BusinessOS One

Ciclo por fase: **Analisar → Planejar → Implementar → Testar → Corrigir → Validar → Documentar → Próxima**.

Uma fase só fecha quando backend, banco, validações, permissões, integrações relevantes e testes reais funcionam — não apenas UI.

| Fase | Nome | Status |
|---|---|---|
| 0 | Proteção e planejamento | Concluída |
| 1 | Auditoria do Finance (read-only) | Concluída (ver `AUDIT-FINANCE.md`) |
| 2 | Fundação (Next, Prisma, modular, RBAC base, erros, logging) | Concluída |
| 3 | Autenticação e empresa | Concluída (fundação) |
| 4 | CRM | Em andamento |
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

## FASE 4 — CRM (detalhe)

| Subfase | Escopo | Status |
|---|---|---|
| 4.1 | Clientes (CRUD, tenant, busca, filtros, RBAC, auditoria) | **Concluída** |
| 4.2 | Leads | Pendente — **próxima** |
| 4.3 | Oportunidades / funil | Pendente |
| 4.4 | Atividades | Pendente |

### O que a FASE 4.1 entregou

- Model `Customer` + migration `add_customers`
- Repository / service / actions em `src/modules/crm`
- Rotas `/app/crm`, `/app/crm/new`, `/app/crm/[id]`, `/app/crm/[id]/edit`
- Soft delete, busca, filtros, detalhes com histórico de auditoria
- RBAC: `crm:view` / `crm:manage` (FINANCE com view)
- Script `npm run verify:customers`

## Próximo passo imediato

Validar FASE 4.1 e, somente depois, iniciar **FASE 4.2 — Leads**. Não alterar o BusinessOS Finance.
