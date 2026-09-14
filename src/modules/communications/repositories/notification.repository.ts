import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type { NotificationListQuery } from "@/modules/communications/schemas/communication.schemas";

export async function findNotifications(params: {
  companyId: string;
  userId: string;
} & NotificationListQuery) {
  const where: Prisma.NotificationWhereInput = {
    companyId: params.companyId,
    userId: params.userId,
  };
  if (params.unread) where.readAt = null;

  const skip = (params.page - 1) * params.pageSize;
  const [total, unreadCount, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { companyId: params.companyId, userId: params.userId, readAt: null },
    }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: params.pageSize,
    }),
  ]);

  return {
    items,
    total,
    unreadCount,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function countUnreadNotifications(params: {
  companyId: string;
  userId: string;
}) {
  return prisma.notification.count({
    where: { companyId: params.companyId, userId: params.userId, readAt: null },
  });
}

export async function createNotificationIfNew(data: {
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Prisma.InputJsonValue;
  idempotencyKey: string;
}) {
  const existing = await prisma.notification.findUnique({
    where: {
      companyId_idempotencyKey: {
        companyId: data.companyId,
        idempotencyKey: data.idempotencyKey,
      },
    },
    select: { id: true },
  });
  if (existing) return null;

  try {
    return await prisma.notification.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link ?? null,
        metadata: data.metadata,
        idempotencyKey: data.idempotencyKey,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}

export async function markNotificationRead(params: {
  companyId: string;
  userId: string;
  notificationId: string;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      id: params.notificationId,
      companyId: params.companyId,
      userId: params.userId,
    },
    select: { id: true, readAt: true },
  });
  if (!existing) return null;
  if (existing.readAt) return existing;
  return prisma.notification.update({
    where: { id: existing.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(params: {
  companyId: string;
  userId: string;
}) {
  return prisma.notification.updateMany({
    where: {
      companyId: params.companyId,
      userId: params.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function findOverdueInstallments(companyId: string, take = 100) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return prisma.installment.findMany({
    where: {
      companyId,
      remainingAmount: { gt: 0 },
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      dueDate: { lt: startOfToday },
    },
    take,
    select: {
      id: true,
      number: true,
      remainingAmount: true,
      dueDate: true,
      accountReceivable: {
        select: {
          id: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function findInventoriesByProducts(params: {
  companyId: string;
  productIds: string[];
}) {
  if (params.productIds.length === 0) return [];
  return prisma.inventory.findMany({
    where: {
      companyId: params.companyId,
      productId: { in: params.productIds },
    },
    include: {
      product: { select: { id: true, name: true } },
    },
  });
}

export async function listMemberships(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId, deletedAt: null, user: { deletedAt: null } },
    select: { userId: true, role: true },
  });
}
