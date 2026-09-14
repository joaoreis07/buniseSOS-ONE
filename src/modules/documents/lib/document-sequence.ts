import { randomBytes } from "crypto";
import type { OperationalDocumentKind, Prisma } from "@prisma/client";
import { Prisma as PrismaNs } from "@prisma/client";

export async function nextOperationalDocumentNumber(
  tx: Prisma.TransactionClient,
  companyId: string,
  kind: OperationalDocumentKind,
) {
  const id = `c${randomBytes(12).toString("hex")}`;
  await tx.$executeRaw`
    INSERT INTO "DocumentSequence" (id, "companyId", kind, "lastValue", "createdAt", "updatedAt")
    VALUES (${id}, ${companyId}, ${kind}::"OperationalDocumentKind", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("companyId", kind) DO NOTHING
  `;
  const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
    UPDATE "DocumentSequence"
    SET "lastValue" = "lastValue" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "companyId" = ${companyId}
      AND kind = ${kind}::"OperationalDocumentKind"
    RETURNING "lastValue"
  `;
  const value = Number(rows[0]?.lastValue);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Falha ao gerar número do documento");
  }
  return value;
}

export function isUniqueViolation(error: unknown) {
  return (
    error instanceof PrismaNs.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
