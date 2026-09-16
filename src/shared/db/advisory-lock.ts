import type { Prisma } from "@prisma/client";

/** Serializes a tenant resource for the rest of the current transaction. */
export async function lockTenantResource(
  tx: Prisma.TransactionClient,
  resource: string,
  companyId: string,
) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${resource}), hashtext(${companyId}))
  `;
}
