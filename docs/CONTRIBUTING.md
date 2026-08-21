# Contribuição — BusinessOS One

## Branches

| Branch | Uso |
|---|---|
| `main` | Estável |
| `develop` | Integração (opcional) |
| `feat/<escopo>` | Nova funcionalidade |
| `fix/<escopo>` | Correção |
| `chore/<escopo>` | Infra, deps, docs |
| `docs/<escopo>` | Documentação |

Exemplos: `feat/auth-login`, `fix/tenant-isolation`, `chore/docker-postgres`.

## Commits (Conventional Commits)

```text
feat: add company membership invite
fix: enforce companyId on customer list
docs: update finance audit decisions
chore: add prisma docker compose on 5433
refactor: centralize permission checks
test: verify tenant isolation for products
```

Regras:

- Mensagens em inglês ou português — manter consistência por PR
- Um propósito por commit
- Nunca commitar `.env`, secrets ou dumps de banco

## Proteção

Não alterar o repositório ou banco do BusinessOS Finance. Ver `docs/PROTECTION.md`.

## Checklist antes de abrir PR

- [ ] Isolamento por tenant respeitado
- [ ] Permissões via RBAC central
- [ ] Validação Zod nas entradas
- [ ] Sem secrets no diff
- [ ] `lint` / `typecheck` ok
- [ ] Migrations novas apenas neste repo
