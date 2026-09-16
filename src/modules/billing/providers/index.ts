import { resolveBillingProviderName } from "@/modules/billing/lib/env";
import { AsaasBillingProvider } from "@/modules/billing/providers/asaas-billing-provider";
import { FakeBillingProvider } from "@/modules/billing/providers/fake-billing-provider";
import type { BillingProvider } from "@/modules/billing/providers/billing-provider";

let cached: BillingProvider | null = null;
let cachedName: string | null = null;

export function getBillingProvider(): BillingProvider {
  const name = resolveBillingProviderName();
  if (cached && cachedName === name) return cached;
  cached = name === "fake" ? new FakeBillingProvider() : new AsaasBillingProvider();
  cachedName = name;
  return cached;
}

export function resetBillingProviderCache() {
  cached = null;
  cachedName = null;
}
