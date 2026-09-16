import type { BillingProduct, Role, SubscriptionStatus } from "@prisma/client";
import { assertPermission, hasPermission } from "@/shared/permissions/rbac";
import { isBillingEnforced } from "@/modules/billing/lib/env";
import { subscriptionGrantsAccess } from "@/modules/billing/lib/status";
import { findSubscriptionByCompanyProduct } from "@/modules/billing/repositories/billing.repository";

export function canViewBilling(role: Role) {
  return hasPermission(role, "billing:view");
}

export function canManageBilling(role: Role) {
  return hasPermission(role, "billing:manage");
}

export function canCancelBilling(role: Role) {
  return hasPermission(role, "billing:cancel");
}

export function assertViewBilling(role: Role) {
  assertPermission(role, "billing:view");
}

export function assertManageBilling(role: Role) {
  assertPermission(role, "billing:manage");
}

export function assertCancelBilling(role: Role) {
  assertPermission(role, "billing:cancel");
}

export function accessFromSubscription(params: {
  status: SubscriptionStatus;
  graceUntil?: Date | null;
}) {
  return subscriptionGrantsAccess(params);
}

/**
 * Central product gate. Do not check subscription.status in UI components.
 *
 * BILLING_ENFORCE off: tenants keep access (dev / existing companies).
 * BILLING_ENFORCE on: ACTIVE and PAST_DUE grant access. PENDING, CANCELLED
 * and missing subscriptions do not. PAST_DUE is not an immediate lock.
 * graceUntil is reserved for a future commercial rule and is not auto-filled.
 */
export async function hasProductAccess(
  companyId: string,
  product: BillingProduct = "ONE",
): Promise<boolean> {
  if (!isBillingEnforced()) return true;

  const subscription = await findSubscriptionByCompanyProduct(companyId, product);
  if (!subscription) return false;
  return accessFromSubscription({
    status: subscription.status,
    graceUntil: subscription.graceUntil,
  });
}
