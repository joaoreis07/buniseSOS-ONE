import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";

export type WriteAuditLogInput = {
  companyId?: string | null;
  userId?: string | null;
  module: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(data: WriteAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      companyId: data.companyId ?? null,
      userId: data.userId ?? null,
      module: data.module,
      action: data.action,
      entity: data.entity ?? null,
      entityId: data.entityId ?? null,
      metadata: data.metadata ?? undefined,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
    },
    select: { id: true },
  });
}

export async function writeSystemLog(params: {
  companyId?: string | null;
  userId?: string | null;
  level?: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  module: string;
  message: string;
  metadata?: Prisma.InputJsonValue | null;
}) {
  return prisma.systemLog.create({
    data: {
      companyId: params.companyId ?? null,
      userId: params.userId ?? null,
      level: params.level ?? "INFO",
      module: params.module,
      message: params.message,
      metadata: params.metadata ?? undefined,
    },
    select: { id: true },
  });
}
