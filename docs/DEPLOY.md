# Deploy — BusinessOS One

Guia mínimo para colocar o One em produção.

BusinessOS Finance permanece isolado: banco, migrations e deploy separados. A cobrança Asaas desta fase é a **assinatura do produto One**, não o financeiro interno do tenant.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16 dedicado (`businessos_one`)
- HTTPS no domínio público
- Variáveis de ambiente fora do repositório

## Variáveis

Copie `.env.example` e preencha valores reais **somente** no ambiente de produção.

Obrigatórias:

- `DATABASE_URL` — PostgreSQL do One (nunca o do Finance)
- `AUTH_SECRET` — segredo longo e aleatório
- `AUTH_URL` — URL pública HTTPS
- `NEXT_PUBLIC_APP_URL` — mesma origem pública (não é segredo)

Opcionais:

- `STORAGE_ROOT` — diretório de arquivos por tenant (padrão `storage/tenants`)
- `NEXT_PUBLIC_APP_NAME`
- `ASAAS_ENV` — `sandbox` (padrão) ou `production`
- `ASAAS_API_KEY` — chave da API Asaas (servidor apenas)
- `ASAAS_BASE_URL` — override opcional da URL v3
- `ASAAS_WEBHOOK_TOKEN` — token do header `asaas-access-token` (nunca a API key)
- `BILLING_PROVIDER` — `asaas` ou `fake` (testes)
- `BILLING_ENFORCE` — `true` para exigir assinatura ACTIVE/PAST_DUE; padrão off para não travar tenants existentes

Webhook: `POST /api/webhooks/asaas`. Configure no painel Asaas (sandbox primeiro) com o mesmo `ASAAS_WEBHOOK_TOKEN`.

Nunca coloque senha, token, `ASAAS_API_KEY` ou `DATABASE_URL` em `NEXT_PUBLIC_*`.

## Banco

```bash
npx prisma migrate deploy
npm run db:verify
```

`db:verify` é um check de isolamento **local** (`localhost:5434` / `businessos_one`). Em produção, confirme migrations com `npx prisma migrate status` no host do One.

Scripts `npm run verify:*` não devem rodar com `NODE_ENV=production` nem contra o banco de clientes.

## Build e start

Em Windows com OneDrive, `next build` pode falhar com `EINVAL readlink` em `.next` se o `next dev` estiver rodando na mesma pasta. Use um diretório de build separado:

```bash
set NEXT_DIST_DIR=.next-prod
npm run build
npx next start -p 3001
```

Rotas autenticadas (`/app/*`) exigem sessão. `/login`, `/api/health` e `POST /api/webhooks/asaas` são públicos (o webhook valida `asaas-access-token`).

## Health check

`GET /api/health`

- `200` `{ "status": "ok" }` — app e banco acessíveis
- `503` `{ "status": "error" }` — banco indisponível

Não retorna segredos nem detalhes internos.

Cabeçalhos de segurança (CSP, frame deny, nosniff, referrer-policy) são aplicados no build de produção. HSTS deve ficar no proxy reverso (nginx, Cloudflare, etc.).

O rate limit de login, cadastro, recuperação de senha, convite e comunicação é **em memória por processo**. Em múltiplas instâncias, cada processo tem o próprio teto. Adequado para um único Node; para escala, usar um limiter compartilhado no deploy.

## Backup

O que precisa ser protegido **antes** de receber clientes reais:

1. **PostgreSQL** — dump periódico (`pg_dump`) do banco `businessos_one`, com retenção e teste de restore.
2. **Arquivos de tenant** — pasta `storage/tenants` (logos). Sem esse diretório, documentos perdem a identidade visual.
3. **Segredos** — `AUTH_SECRET`, `DATABASE_URL`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` no gerenciador de secrets do host, não no git.

Restauração: restaurar o dump no PostgreSQL do One, aplicar `prisma migrate deploy` se o schema estiver atrás, e recolocar `storage/tenants` no mesmo `STORAGE_ROOT`.

Não há rotina automática de backup neste repositório.

## Observabilidade

A aplicação registra auditoria de operações e evita logar senha, token, cookie ou convite em texto puro.

Não há APM externo nesta fase. Em deploy futuro, conectar logs/erros a um provedor (sem enviar secrets).

## Isolamento

Nunca aponte `DATABASE_URL` do One para o Finance. Nunca reutilize migrations do Finance.
