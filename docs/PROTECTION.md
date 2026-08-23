# Proteção do BusinessOS Finance

## Regra absoluta

O **BusinessOS Finance** e o **BusinessOS One** são produtos, repositórios, aplicações, deploys e bancos **independentes**.

Repositório protegido (somente referência read-only):

`https://github.com/joaoreis07/buniseSOS-FINANCE.git`

Caminho local de referência (não editar):

`C:\Users\jgrei\OneDrive\Desktop\BuniseSOS-Finance`

## Nunca fazer

- Alterar arquivos do repositório `buniseSOS-FINANCE`
- Criar funcionalidades do One dentro do Finance
- Reutilizar migrations do Finance no One
- Conectar o `DATABASE_URL` do One ao banco do Finance
- Alterar rotas, APIs, dependências ou deploy do Finance
- Modificar o Finance para facilitar o desenvolvimento do One
- Compartilhar volume Docker / container / porta do Postgres do Finance

## Integração futura

Se no futuro houver integração entre produtos, ela deve ocorrer por **API formal e documentada**, nunca por acesso direto ao banco do Finance.

## Isolamento local (Postgres)

| | Finance | One |
|---|---|---|
| Database | `businessos_finance` | `businessos_one` |
| Porta host | `5432` | `5434` |
| Container | `businessos-postgres` | `businessos-one-postgres` |
| Volume | `businessos_pg_data` | `businessos_one_pg_data` |

> A porta `5433` está em uso pelo BusinessOS Odonto nesta máquina. O One usa `5434` para coexistir sem tocar no Finance.
