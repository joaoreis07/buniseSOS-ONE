import { createHash, timingSafeEqual } from "crypto";
import { BillingAuthError, BillingConfigError } from "@/modules/billing/lib/errors";
import { getAsaasWebhookToken } from "@/modules/billing/lib/env";

export function timingSafeEqualString(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function assertAsaasWebhookToken(
  header: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): void {
  let expected: string;
  try {
    expected = getAsaasWebhookToken(env);
  } catch {
    throw new BillingConfigError("ASAAS_WEBHOOK_TOKEN não configurado");
  }
  if (!header || !timingSafeEqualString(header, expected)) {
    throw new BillingAuthError();
  }
}
