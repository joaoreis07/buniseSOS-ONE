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
| 4.1 | Clientes | **Concluída** |
| 4.2 | Leads | **Concluída** |
| 4.3 | Oportunidades | **Concluída** |
| 4.4 | Funil de vendas | Pendente — **próxima** |
| 4.5 | Atividades / Follow-up | Pendente |
| 4.6 | Dashboard CRM | Pendente |

### O que a FASE 4.3 entregou

- Model `Opportunity` + migration `add_opportunities`
- Estágios: NEW → QUALIFIED → PROPOSAL → NEGOTIATION → WON / LOST
- Vínculos opcionais com Lead e Customer (mesmo tenant)
- Valor estimado, probabilidade, previsão de fechamento
- Rotas `/app/crm/opportunities` (+ new/detail/edit)
- Permissões `crm:opportunities:view` / `crm:opportunities:manage`
- Sem funil visual/kanban (FASE 4.4)
- Script `npm run verify:opportunities`

## Próximo passo imediato

Validar FASE 4.3 e, somente depois, iniciar **FASE 4.4 — Funil de vendas**. Não alterar o BusinessOS Finance.
