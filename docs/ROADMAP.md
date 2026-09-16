# Roadmap oficial — BusinessOS One

Ciclo por fase: **Analisar → Planejar → Implementar → Testar → Corrigir → Validar → Documentar → Próxima**.

Uma fase só fecha quando backend, banco, validações, permissões, integrações relevantes e testes reais funcionam — não apenas UI.

Numeração oficial do produto (não reabrir fases concluídas):

| Fase | Nome | Status |
|---|---|---|
| 0 | Proteção e planejamento | Concluída |
| 1 | Auditoria do Finance (read-only) | Concluída (ver `AUDIT-FINANCE.md`) |
| 2 | Fundação | Concluída |
| 3 | Autenticação e empresa | Concluída |
| 4 | CRM | Concluída |
| 5 | Produtos e serviços | Concluída |
| 6 | Estoque | Concluída |
| 7 | Vendas | Concluída |
| 8 | Financeiro e parcelas | Concluída |
| 9 | Compras e fornecedores | Concluída |
| 10 | Dashboard e relatórios | Concluída |
| 11 | CRM / clientes avançado | Concluída |
| 12 | Comunicações / WhatsApp / notificações | Concluída |
| 13 | Equipe / usuários / permissões | Concluída |
| 14 | Configurações / documentos / personalização | Concluída |
| 15 | Preparação para produção | Concluída |

Fora desta fase (não iniciar agora): Asaas, assinaturas SaaS, painel central de assinantes Finance + Odonto + One.

## FASE 4 — CRM (detalhe)

| Subfase | Escopo | Status |
|---|---|---|
| 4.1 | Clientes | **Concluída** |
| 4.2 | Leads | **Concluída** |
| 4.3 | Oportunidades | **Concluída** |
| 4.4 | Funil de vendas | **Concluída** |
| 4.5 | Atividades / Follow-up | **Concluída** |
| 4.6 | Dashboard CRM | **Concluída** |

### O que a FASE 4 entregou

- Clientes, Leads, Oportunidades (CRUD + soft delete + auditoria)
- Funil Kanban (`/app/crm/pipeline`) com mudança de estágio
- Atividades/Follow-up vinculadas a Customer / Lead / Opportunity
- Dashboard CRM com indicadores do tenant
- Permissões: `crm:*`, `crm:leads:*`, `crm:opportunities:*`, `crm:pipeline:*`, `crm:activities:*`, `crm:dashboard:view`
- Verificações: `verify:customers`, `verify:leads`, `verify:opportunities`, `verify:pipeline`, `verify:activities`, `verify:crm`

## Próximo passo imediato

FASE 15 concluída. Não alterar o BusinessOS Finance. Não iniciar Asaas, assinaturas SaaS nem o painel de assinantes até autorização explícita.
