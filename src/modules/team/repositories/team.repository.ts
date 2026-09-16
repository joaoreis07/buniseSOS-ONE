import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type { TeamListQuery } from "@/modules/team/schemas/team.schemas";

export async function expirePendingInvites(companyId: string) {
  await prisma.invite.updateMany({
    where: {
      companyId,
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
}

export async function countActiveAdmins(companyId: string) {
  return prisma.membership.count({
    where: {
      companyId,
      role: "ADMIN",
      deletedAt: null,
      user: { deletedAt: null },
    },
  });
}

export async function lockActiveAdmins(
  tx: Prisma.TransactionClient,
  companyId: string,
) {
  await tx.$queryRaw`
    SELECT m.id
    FROM "Membership" m
    INNER JOIN "User" u ON u.id = m."userId"
    WHERE m."companyId" = ${companyId}
      AND m.role = 'ADMIN'::"Role"
      AND m."deletedAt" IS NULL
      AND u."deletedAt" IS NULL
    FOR UPDATE OF m
  `;
}

export async function countActiveAdminsInTx(
  tx: Prisma.TransactionClient,
  companyId: string,
) {
  return tx.membership.count({
    where: {
      companyId,
      role: "ADMIN",
      deletedAt: null,
      user: { deletedAt: null },
    },
  });
}

export async function findMembershipById(params: {
  companyId: string;
  membershipId: string;
}) {
  return prisma.membership.findFirst({
    where: { id: params.membershipId, companyId: params.companyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          emailVerified: true,
        },
      },
      company: { select: { id: true, name: true } },
    },
  });
}

export async function findMembers(params: {
  companyId: string;
} & TeamListQuery) {
  const where: Prisma.MembershipWhereInput = { companyId: params.companyId };
  if (params.role) where.role = params.role;
  if (params.status === "active") where.deletedAt = null;
  if (params.status === "inactive") where.deletedAt = { not: null };

  const q = params.q?.trim();
  if (q) {
    where.user = {
      is: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
    };
  }

  const skip = (params.page - 1) * params.pageSize;
  const [total, items] = await Promise.all([
    prisma.membership.count({ where }),
    prisma.membership.findMany({
      where,
      orderBy: [
        { deletedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "asc" },
      ],
      skip,
      take: params.pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
    }),
  ]);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function findLastLogins(params: {
  companyId: string;
  userIds: string[];
}) {
  if (params.userIds.length === 0) return new Map<string, Date>();
  const rows = await prisma.auditLog.findMany({
    where: {
      companyId: params.companyId,
      action: "LOGIN",
      userId: { in: params.userIds },
    },
    orderBy: { createdAt: "desc" },
    distinct: ["userId"],
    select: { userId: true, createdAt: true },
  });
  return new Map(
    rows
      .filter((row) => row.userId)
      .map((row) => [row.userId as string, row.createdAt]),
  );
}

export async function findMemberActivities(params: {
  companyId: string;
  userId: string;
  take?: number;
}) {
  return prisma.activity.findMany({
    where: {
      companyId: params.companyId,
      ownerId: params.userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: params.take ?? 10,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      dueAt: true,
    },
  });
}

export async function findMemberAudit(params: {
  companyId: string;
  userId: string;
  membershipId: string;
}) {
  return prisma.auditLog.findMany({
    where: {
      companyId: params.companyId,
      OR: [
        { entity: "Membership", entityId: params.membershipId },
        { entity: "User", entityId: params.userId, module: { in: ["auth", "members"] } },
        { userId: params.userId, module: "members" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      action: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function findInvites(params: {
  companyId: string;
  status?: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
}) {
  await expirePendingInvites(params.companyId);
  return prisma.invite.findMany({
    where: {
      companyId: params.companyId,
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
  });
}

export async function findInviteById(params: {
  companyId: string;
  inviteId: string;
}) {
  return prisma.invite.findFirst({
    where: { id: params.inviteId, companyId: params.companyId },
  });
}

export async function updateMembershipRole(params: {
  membershipId: string;
  role: Role;
}) {
  return prisma.membership.update({
    where: { id: params.membershipId },
    data: { role: params.role },
  });
}

export async function setMembershipDeletedAt(params: {
  membershipId: string;
  deletedAt: Date | null;
}) {
  return prisma.membership.update({
    where: { id: params.membershipId },
    data: { deletedAt: params.deletedAt },
  });
}

export async function getCompanyOverview(companyId: string) {
  const [company, settings, activeMembers, pendingInvites] = await Promise.all([
    prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.companySettings.findUnique({
      where: { companyId },
    }),
    prisma.membership.count({
      where: { companyId, deletedAt: null, user: { deletedAt: null } },
    }),
    prisma.invite.count({
      where: { companyId, status: "PENDING", expiresAt: { gt: new Date() } },
    }),
  ]);
  return { company, settings, activeMembers, pendingInvites };
}
