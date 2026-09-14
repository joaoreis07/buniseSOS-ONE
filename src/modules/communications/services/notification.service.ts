import type { NotificationType, Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { assertPermission, hasPermission, type Permission } from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import type { NotificationListQuery } from "@/modules/communications/schemas/communication.schemas";
import {
  countUnreadNotifications,
  createNotificationIfNew,
  findInventoriesByProducts,
  findNotifications,
  findOverdueInstallments,
  listMemberships,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/communications/repositories/notification.repository";

export function canViewNotifications(role: Role) {
  return hasPermission(role, "notifications:view");
}

async function usersWithPermission(companyId: string, permission: Permission) {
  const memberships = await listMemberships(companyId);
  return memberships
    .filter((item) => hasPermission(item.role, permission))
    .map((item) => item.userId);
}

async function notifyMany(params: {
  companyId: string;
  actorUserId?: string | null;
  excludeActor?: boolean;
  permission: Permission;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const userIds = await usersWithPermission(params.companyId, params.permission);
  const targets = params.excludeActor
    ? userIds.filter((id) => id !== params.actorUserId)
    : userIds;
  const createdIds: string[] = [];

  for (const userId of targets) {
    const created = await createNotificationIfNew({
      companyId: params.companyId,
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: {
        entity: params.entity,
        entityId: params.entityId,
        ...(params.metadata ?? {}),
      } as Prisma.InputJsonValue,
      idempotencyKey: `${params.type}:${params.entity}:${params.entityId}:${userId}`,
    });
    if (created) {
      createdIds.push(created.id);
      await writeAuditLog({
        companyId: params.companyId,
        userId: params.actorUserId ?? userId,
        module: "notifications",
        action: "NOTIFICATION_CREATED",
        entity: "Notification",
        entityId: created.id,
        metadata: { type: params.type, recipientId: userId, entityId: params.entityId },
      });
    }
  }

  return createdIds;
}

export async function notifySaleCompleted(params: {
  companyId: string;
  actorUserId: string;
  saleId: string;
  saleNumber: number;
  total: unknown;
  customerName?: string | null;
}) {
  const total = formatMoneyBRL(params.total);
  const who = params.customerName ? ` para ${params.customerName}` : "";
  return notifyMany({
    companyId: params.companyId,
    actorUserId: params.actorUserId,
    excludeActor: true,
    permission: "sales:view",
    type: "SALE_COMPLETED",
    title: `Venda V-${String(params.saleNumber).padStart(5, "0")} concluída`,
    message: `Venda no valor de ${total}${who}.`,
    link: `/app/sales/${params.saleId}`,
    entity: "Sale",
    entityId: params.saleId,
  });
}

export async function notifyPaymentReceived(params: {
  companyId: string;
  actorUserId: string;
  paymentId: string;
  receivableId: string;
  amount: unknown;
  customerName?: string | null;
}) {
  const who = params.customerName ? ` de ${params.customerName}` : "";
  return notifyMany({
    companyId: params.companyId,
    actorUserId: params.actorUserId,
    excludeActor: true,
    permission: "finance:view",
    type: "PAYMENT_RECEIVED",
    title: "Pagamento recebido",
    message: `Recebido ${formatMoneyBRL(params.amount)}${who}.`,
    link: `/app/finance/${params.receivableId}`,
    entity: "InstallmentPayment",
    entityId: params.paymentId,
  });
}

export async function notifyPurchaseReceived(params: {
  companyId: string;
  actorUserId: string;
  purchaseId: string;
  purchaseNumber: number;
}) {
  return notifyMany({
    companyId: params.companyId,
    actorUserId: params.actorUserId,
    excludeActor: true,
    permission: "inventory:view",
    type: "PURCHASE_RECEIVED",
    title: `Compra C-${String(params.purchaseNumber).padStart(5, "0")} recebida`,
    message: "A compra foi recebida e o estoque foi atualizado.",
    link: `/app/purchases/${params.purchaseId}`,
    entity: "Purchase",
    entityId: params.purchaseId,
  });
}

export async function notifyTaskAssigned(params: {
  companyId: string;
  actorUserId: string;
  activityId: string;
  ownerId: string | null | undefined;
  title: string;
}) {
  if (!params.ownerId || params.ownerId === params.actorUserId) return [];
  const created = await createNotificationIfNew({
    companyId: params.companyId,
    userId: params.ownerId,
    type: "TASK_ASSIGNED",
    title: "Nova atividade atribuída a você",
    message: params.title,
    link: `/app/crm/activities/${params.activityId}`,
    metadata: { entity: "Activity", entityId: params.activityId },
    idempotencyKey: `TASK_ASSIGNED:Activity:${params.activityId}:${params.ownerId}`,
  });
  if (!created) return [];
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.actorUserId,
    module: "notifications",
    action: "NOTIFICATION_CREATED",
    entity: "Notification",
    entityId: created.id,
    metadata: { type: "TASK_ASSIGNED", recipientId: params.ownerId },
  });
  return [created.id];
}

export async function notifyStockForProducts(params: {
  companyId: string;
  actorUserId?: string;
  productIds: string[];
}) {
  const inventories = await findInventoriesByProducts(params);
  const created: string[] = [];
  for (const inventory of inventories) {
    const qty = inventory.quantity;
    const min = inventory.minimumQuantity;
    const name = inventory.product.name;
    if (qty === 0) {
      created.push(
        ...(await notifyMany({
          companyId: params.companyId,
          actorUserId: params.actorUserId,
          excludeActor: false,
          permission: "inventory:view",
          type: "OUT_OF_STOCK",
          title: `Sem estoque: ${name}`,
          message: `${name} está com saldo zero.`,
          link: `/app/inventory/${inventory.productId}`,
          entity: "Product",
          entityId: inventory.productId,
        })),
      );
      continue;
    }
    if (min > 0 && qty <= min) {
      created.push(
        ...(await notifyMany({
          companyId: params.companyId,
          actorUserId: params.actorUserId,
          excludeActor: false,
          permission: "inventory:view",
          type: "LOW_STOCK",
          title: `Estoque baixo: ${name}`,
          message: `${name} está com ${qty} unidade(s) (mínimo ${min}).`,
          link: `/app/inventory/${inventory.productId}`,
          entity: "Product",
          entityId: inventory.productId,
        })),
      );
    }
  }
  return created;
}

export async function syncOverdueNotifications(companyId: string) {
  const overdue = await findOverdueInstallments(companyId);
  const created: string[] = [];
  for (const installment of overdue) {
    const customerName =
      installment.accountReceivable.customer?.name ?? "Cliente";
    created.push(
      ...(await notifyMany({
        companyId,
        excludeActor: false,
        permission: "finance:view",
        type: "OVERDUE_RECEIVABLE",
        title: `Parcela vencida: ${customerName}`,
        message: `${customerName} possui parcela ${installment.number} vencida em ${formatDateBR(installment.dueDate)} (${formatMoneyBRL(installment.remainingAmount)}).`,
        link: `/app/finance/${installment.accountReceivable.id}`,
        entity: "Installment",
        entityId: installment.id,
      })),
    );
  }
  return created;
}

export async function listNotificationsForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  query: NotificationListQuery;
}) {
  assertPermission(params.role, "notifications:view");
  await syncOverdueNotifications(params.companyId);
  return findNotifications({
    companyId: params.companyId,
    userId: params.userId,
    ...params.query,
  });
}

export async function getUnreadNotificationCount(params: {
  companyId: string;
  userId: string;
  role: Role;
}) {
  if (!canViewNotifications(params.role)) return 0;
  await syncOverdueNotifications(params.companyId);
  return countUnreadNotifications(params);
}

export async function markNotificationReadForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  notificationId: string;
}) {
  assertPermission(params.role, "notifications:view");
  const updated = await markNotificationRead(params);
  if (!updated) throw new Error("Notificação não encontrada");
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "notifications",
    action: "NOTIFICATION_READ",
    entity: "Notification",
    entityId: updated.id,
  });
  return updated;
}

export async function markAllNotificationsReadForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
}) {
  assertPermission(params.role, "notifications:view");
  const result = await markAllNotificationsRead(params);
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "notifications",
    action: "NOTIFICATION_READ",
    entity: "Notification",
    metadata: { all: true, count: result.count },
  });
  return result;
}
