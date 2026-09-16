const SANDBOX_BASE_URL = "https://api-sandbox.asaas.com/v3";
const PRODUCTION_BASE_URL = "https://api.asaas.com/v3";

export type BillingProviderName = "asaas" | "fake";
export type AsaasEnvironment = "sandbox" | "production";

export function resolveBillingProviderName(
  env: NodeJS.ProcessEnv = process.env,
): BillingProviderName {
  const explicit = env.BILLING_PROVIDER?.trim().toLowerCase();
  if (explicit === "fake") return "fake";
  if (explicit === "asaas") return "asaas";
  return env.ASAAS_API_KEY?.trim() ? "asaas" : "fake";
}

export function isBillingEnforced(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.BILLING_ENFORCE?.trim().toLowerCase();
  return value === "true" || value === "1";
}

export function resolveAsaasEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): AsaasEnvironment {
  const value = env.ASAAS_ENV?.trim().toLowerCase();
  if (value === "production" || value === "prod") return "production";
  return "sandbox";
}

export function resolveAsaasBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.ASAAS_BASE_URL?.trim().replace(/\/$/, "");
  if (override) return override;
  return resolveAsaasEnvironment(env) === "production"
    ? PRODUCTION_BASE_URL
    : SANDBOX_BASE_URL;
}

export function getAsaasApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.ASAAS_API_KEY?.trim();
  if (!key) {
    throw new Error("ASAAS_API_KEY não configurada");
  }
  return key;
}

export function getAsaasWebhookToken(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const token = env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!token) {
    throw new Error("ASAAS_WEBHOOK_TOKEN não configurado");
  }
  return token;
}

export function isBillingExemptPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/app/settings/billing" ||
    pathname.startsWith("/app/settings/billing/")
  );
}
