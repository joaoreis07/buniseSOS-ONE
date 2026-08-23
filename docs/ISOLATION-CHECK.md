# Isolation Check — BusinessOS One

**Data:** 2026-08-23  
**Escopo:** somente `businessos-one` (nenhuma alteração no Finance)

## Resultado

```text
DATABASE isolado: OK
Docker isolado: OK
Porta isolada: OK (5434)
Migrations isoladas: OK
ENV isolado: OK
Código isolado: OK
Git isolado: OK
Deploy isolado: OK
```

## Evidências

| Checagem | Resultado | Detalhe |
|---|---|---|
| `DATABASE_URL` | OK | `postgresql://…@localhost:5434/businessos_one` |
| Docker Compose | OK | container `businessos-one-postgres`, DB `businessos_one`, volume `businessos_one_pg_data` |
| Porta host | OK | `5434:5432` |
| Prisma | OK | `env("DATABASE_URL")` — sem hardcode do Finance |
| Migrations | OK | `prisma/migrations/20260823232550_init_auth_tenant` (somente deste repositório) |
| Código runtime | OK | sem imports/paths/APIs do Finance |
| Git remote | OK | destino `joaoreis07/buniseSOS-ONE` (não FINANCE) |
| Deploy | OK | sem `vercel.json`/config do Finance neste repo |

## Mapa de portas local (coexistência)

| Produto | Container | Porta host | Database |
|---|---|---|---|
| BusinessOS Finance | `businessos-postgres` | `5432` | `businessos_finance` |
| BusinessOS Odonto | `businessos-odonto-postgres` | `5433` | `businessos_odonto` |
| BusinessOS One | `businessos-one-postgres` | `5434` | `businessos_one` |

> Nota (2026-08-23): o plano inicial do One usava `5433`, mas essa porta já estava ocupada pelo Odonto (`restart: unless-stopped`). O One foi estabilizado em **5434** para coexistir sem derrubar outros produtos e sem tocar no Finance.

## Menções ao Finance (permitidas)

Apenas documentação de proteção/comparação:

- `docs/PROTECTION.md`
- `docs/AUDIT-FINANCE.md`
- `README.md` / comentários em `.env.example`

Nenhuma variável de runtime aponta para infraestrutura do Finance.

## Como revalidar

```bash
npm run db:up
npm run db:verify
npm run verify:foundation
```
