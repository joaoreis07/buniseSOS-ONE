/**
 * Team / users / permissions verification (FASE 13) — BusinessOS One only.
 * Run: npm run verify:team
 */
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import {
  hasPermission,
  rolesAssignableBy,
} from "../src/shared/permissions/rbac";
import {
  acceptInvite,
  getInvitePreview,
  getPrimaryMembership,
  getUserSessionVersion,
  hashToken,
  validateMembership,
} from "../src/modules/auth/services/auth.service";
import {
  activateMemberForTenant,
  changeMemberRoleForTenant,
  deactivateMemberForTenant,
  getAccessMatrixForRole,
  getMemberForTenant,
  inviteMemberForTenant,
  listInvitesForTenant,
  listTeamForTenant,
  resendInviteForTenant,
  revokeInviteForTenant,
} from "../src/modules/team/services/team.service";
import { createActivityForTenant } from "../src/modules/crm/services/activity.service";
import { listCompanyOwners } from "../src/modules/crm/repositories/opportunity.repository";
import { listNotificationsForTenant } from "../src/modules/communications/services/notification.service";
import { getSalesReportForTenant } from "../src/modules/reports/services/reports.service";
import { assertVerificationDatabase } from "./lib/assert-one-database";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

async function expectThrow(fn: () => Promise<unknown>, message: string) {
  let thrown = false;
  try {
    await fn();
  } catch {
    thrown = true;
  }
  assert(thrown, message);
}

async function registerTenant(input: {
  name: string;
  email: string;
  companyName: string;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: input.name, email: input.email.toLowerCase(), passwordHash },
    });
    const company = await tx.company.create({ data: { name: input.companyName } });
    await tx.membership.create({
      data: { userId: user.id, companyId: company.id, role: "ADMIN" },
    });
    await tx.companySettings.create({ data: { companyId: company.id } });
    return { user, company };
  });
}

async function addMember(params: {
  companyId: string;
  name: string;
  email: string;
  role: Role;
}) {
  const passwordHash = await hash("TestPass123!", 12);
  const user = await prisma.user.create({
    data: { name: params.name, email: params.email.toLowerCase(), passwordHash },
  });
  const membership = await prisma.membership.create({
    data: { userId: user.id, companyId: params.companyId, role: params.role },
  });
  return { user, membership };
}

async function main() {
  assertVerificationDatabase();

  assert(hasPermission("ADMIN", "team:view"), "ADMIN team:view");
  assert(hasPermission("ADMIN", "team:manage"), "ADMIN team:manage");
  assert(hasPermission("MANAGER", "team:view"), "MANAGER team:view");
  assert(hasPermission("MANAGER", "team:manage"), "MANAGER team:manage");
  assert(!hasPermission("SALES", "team:view"), "SALES no team:view");
  assert(!hasPermission("SALES", "team:manage"), "SALES no team:manage");
  assert(!hasPermission("FINANCE", "team:view"), "FINANCE no team:view");
  assert(!hasPermission("INVENTORY", "team:manage"), "INVENTORY no team:manage");
  assert(rolesAssignableBy("ADMIN").includes("ADMIN"), "ADMIN can assign ADMIN");
  assert(!rolesAssignableBy("MANAGER").includes("ADMIN"), "MANAGER cannot assign ADMIN");
  assert(rolesAssignableBy("SALES").length === 0, "SALES cannot assign roles");

  const matrix = getAccessMatrixForRole("ADMIN");
  assert(matrix.SALES.includes("sales:create"), "matrix sales create");
  assert(!matrix.SALES.includes("team:manage"), "matrix sales no team");
  assert(matrix.INVENTORY.includes("inventory:movements"), "matrix inventory movements");
  assert(!matrix.INVENTORY.includes("finance:manage"), "matrix inventory no finance");

  const suffix = randomBytes(3).toString("hex");
  const a = await registerTenant({
    name: "Admin A",
    email: `team-a-${suffix}@example.com`,
    companyName: `Empresa Team A ${suffix}`,
  });
  const b = await registerTenant({
    name: "Admin B",
    email: `team-b-${suffix}@example.com`,
    companyName: `Empresa Team B ${suffix}`,
  });

  const manager = await addMember({
    companyId: a.company.id,
    name: "Gerente A",
    email: `team-mgr-${suffix}@example.com`,
    role: "MANAGER",
  });
  const sales = await addMember({
    companyId: a.company.id,
    name: "Vendas A",
    email: `team-sales-${suffix}@example.com`,
    role: "SALES",
  });
  const finance = await addMember({
    companyId: a.company.id,
    name: "Finance A",
    email: `team-fin-${suffix}@example.com`,
    role: "FINANCE",
  });
  const inventory = await addMember({
    companyId: a.company.id,
    name: "Estoque A",
    email: `team-inv-${suffix}@example.com`,
    role: "INVENTORY",
  });
  const secondAdmin = await addMember({
    companyId: a.company.id,
    name: "Admin 2",
    email: `team-admin2-${suffix}@example.com`,
    role: "ADMIN",
  });

  await expectThrow(
    () =>
      listTeamForTenant({
        companyId: a.company.id,
        role: "SALES",
        query: { page: 1, pageSize: 20 },
      }),
    "sales cannot list team",
  );

  await prisma.auditLog.create({
    data: {
      companyId: a.company.id,
      userId: sales.user.id,
      module: "auth",
      action: "LOGIN",
      entity: "User",
      entityId: sales.user.id,
    },
  });

  const listed = await listTeamForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { page: 1, pageSize: 20 },
  });
  assert(listed.total >= 4, "company A members listed");
  const listedIds = new Set(listed.items.map((item) => item.user.id));
  assert(listedIds.has(a.user.id), "includes admin A");
  assert(!listedIds.has(b.user.id), "does not leak tenant B");
  assert(
    listed.items.some(
      (item) => item.user.id === sales.user.id && item.lastAccessAt != null,
    ),
    "last access from LOGIN audit",
  );

  const leaked = await getMemberForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    membershipId: (
      await prisma.membership.findFirstOrThrow({
        where: { userId: b.user.id, companyId: b.company.id },
      })
    ).id,
  });
  assert(leaked === null, "cannot read other tenant membership");

  const pageOne = await listTeamForTenant({
    companyId: a.company.id,
    role: "MANAGER",
    query: { page: 1, pageSize: 2 },
  });
  const pageTwo = await listTeamForTenant({
    companyId: a.company.id,
    role: "MANAGER",
    query: { page: 2, pageSize: 2 },
  });
  assert(pageOne.pageCount >= 2, "pagination has multiple pages");
  assert(pageOne.items.length === 2, "page size honored");
  assert(
    pageOne.items[0]?.id !== pageTwo.items[0]?.id,
    "page 2 returns different members",
  );

  const salesFilter = await listTeamForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { role: "SALES", status: "active", page: 1, pageSize: 20 },
  });
  assert(
    salesFilter.items.every((item) => item.role === "SALES" && item.active),
    "role and status filters",
  );

  await prisma.activity.create({
    data: {
      companyId: a.company.id,
      title: `Follow-up ${suffix}`,
      type: "TASK",
      status: "PENDING",
      ownerId: sales.user.id,
    },
  });
  const salesSheet = await getMemberForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    membershipId: sales.membership.id,
  });
  assert(salesSheet, "sales member sheet");
  assert(
    salesSheet.activities.some((item) => item.title.includes(suffix)),
    "assigned activity on member sheet",
  );
  assert(salesSheet.permissions.includes("sales:view"), "inherited sales permission");
  assert(!salesSheet.permissions.includes("team:manage"), "sales has no team:manage");

  const search = await listTeamForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: { q: sales.user.email, page: 1, pageSize: 20 },
  });
  assert(
    search.items.length === 1 && search.items[0]?.user.id === sales.user.id,
    "search by email",
  );

  let salesCannotSeeMatrix = false;
  try {
    getAccessMatrixForRole("SALES");
  } catch {
    salesCannotSeeMatrix = true;
  }
  assert(salesCannotSeeMatrix, "sales cannot view permission matrix");
  await expectThrow(
    () =>
      listTeamForTenant({
        companyId: a.company.id,
        role: "FINANCE",
        query: { page: 1, pageSize: 20 },
      }),
    "finance cannot list team",
  );
  await expectThrow(
    () =>
      inviteMemberForTenant({
        companyId: a.company.id,
        userId: inventory.user.id,
        role: "INVENTORY",
        email: `team-escalation-${suffix}@example.com`,
        inviteRole: "ADMIN",
      }),
    "inventory cannot invite",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: sales.user.id,
        actorRole: "SALES",
        membershipId: sales.membership.id,
        role: "ADMIN",
      }),
    "sales cannot self-promote",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: finance.user.id,
        actorRole: "FINANCE",
        membershipId: finance.membership.id,
        role: "ADMIN",
      }),
    "finance cannot self-promote",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: inventory.user.id,
        actorRole: "INVENTORY",
        membershipId: manager.membership.id,
        role: "SALES",
      }),
    "inventory cannot change another member role",
  );

  const customer = await prisma.customer.create({
    data: {
      companyId: a.company.id,
      name: `Cliente Team ${suffix}`,
      type: "INDIVIDUAL",
      status: "ACTIVE",
    },
  });
  await createActivityForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    data: {
      title: `Tarefa notificada ${suffix}`,
      description: null,
      type: "TASK",
      status: "PENDING",
      ownerId: sales.user.id,
      dueAt: null,
      customerId: customer.id,
      leadId: null,
      opportunityId: null,
    },
  });
  const salesNotes = await listNotificationsForTenant({
    companyId: a.company.id,
    userId: sales.user.id,
    role: "SALES",
    query: { page: 1, pageSize: 20 },
  });
  assert(
    salesNotes.items.some((item) => item.type === "TASK_ASSIGNED"),
    "assigned activity creates notification",
  );
  const leakedNotes = await listNotificationsForTenant({
    companyId: b.company.id,
    userId: b.user.id,
    role: "ADMIN",
    query: { page: 1, pageSize: 20 },
  });
  assert(
    leakedNotes.items.every((item) => item.type !== "TASK_ASSIGNED" || !item.message?.includes(suffix)),
    "tenant B does not receive tenant A assignment",
  );

  await prisma.sale.create({
    data: {
      companyId: a.company.id,
      customerId: customer.id,
      sellerId: sales.user.id,
      number: 1,
      status: "COMPLETED",
      paymentMethod: "PIX",
      subtotal: 150,
      total: 150,
      completedAt: new Date(),
    },
  });

  const firstInvite = await inviteMemberForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    email: `team-new-${suffix}@example.com`,
    inviteRole: "SALES",
  });
  assert(firstInvite.invite.token !== firstInvite.token, "token not stored in plaintext");
  assert(
    firstInvite.invite.token === hashToken(firstInvite.token),
    "stored token is sha256",
  );
  const preview = await getInvitePreview(firstInvite.token);
  assert(preview.status === "PENDING", "preview pending");

  const secondInvite = await inviteMemberForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    email: `team-new-${suffix}@example.com`,
    inviteRole: "FINANCE",
  });
  const oldPreview = await getInvitePreview(firstInvite.token);
  assert(oldPreview.status === "REVOKED", "previous pending invite revoked");
  assert(secondInvite.invite.role === "FINANCE", "latest invite role kept");
  const pendingDup = await prisma.invite.count({
    where: {
      companyId: a.company.id,
      email: `team-new-${suffix}@example.com`,
      status: "PENDING",
    },
  });
  assert(pendingDup === 1, "only one pending invite per email");

  await expectThrow(
    () =>
      inviteMemberForTenant({
        companyId: a.company.id,
        userId: manager.user.id,
        role: "MANAGER",
        email: `team-admin-invite-${suffix}@example.com`,
        inviteRole: "ADMIN",
      }),
    "manager cannot invite ADMIN",
  );

  await expectThrow(
    () =>
      inviteMemberForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        email: sales.user.email,
        inviteRole: "SALES",
      }),
    "cannot invite existing active member",
  );

  const accepted = await acceptInvite({
    token: secondInvite.token,
    name: "Novo Financeiro",
    password: "TestPass123!",
  });
  assert(accepted.companyId === a.company.id, "accepted into tenant A");
  assert(accepted.role === "FINANCE", "accepted role");
  assert(
    accepted.user.email === `team-new-${suffix}@example.com`,
    "membership bound to invited email",
  );
  await expectThrow(
    () =>
      acceptInvite({
        token: secondInvite.token,
        name: "Novo Financeiro",
        password: "TestPass123!",
      }),
    "consumed invite cannot be reused",
  );

  const resendTarget = await inviteMemberForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    email: `team-resend-${suffix}@example.com`,
    inviteRole: "INVENTORY",
  });
  const resent = await resendInviteForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    inviteId: resendTarget.invite.id,
  });
  const stale = await getInvitePreview(resendTarget.token);
  assert(stale.status === "INVALID", "old resend token invalid");
  assert((await getInvitePreview(resent.token)).status === "PENDING", "new token pending");

  const expiredInvite = await inviteMemberForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    email: `team-exp-${suffix}@example.com`,
    inviteRole: "SALES",
  });
  await prisma.invite.update({
    where: { id: expiredInvite.invite.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const expiredPreview = await getInvitePreview(expiredInvite.token);
  assert(expiredPreview.status === "EXPIRED", "expired preview");
  await expectThrow(
    () =>
      acceptInvite({
        token: expiredInvite.token,
        name: "Expirado",
        password: "TestPass123!",
      }),
    "expired invite cannot be accepted",
  );
  const reactivatedInvite = await resendInviteForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    inviteId: expiredInvite.invite.id,
  });
  assert(
    (await getInvitePreview(reactivatedInvite.token)).status === "PENDING",
    "resend after expiry works",
  );

  const revokeTarget = await inviteMemberForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    email: `team-rev-${suffix}@example.com`,
    inviteRole: "SALES",
  });
  await revokeInviteForTenant({
    companyId: a.company.id,
    userId: a.user.id,
    role: "ADMIN",
    inviteId: revokeTarget.invite.id,
  });
  await expectThrow(
    () =>
      acceptInvite({
        token: revokeTarget.token,
        name: "Revogado",
        password: "TestPass123!",
      }),
    "revoked invite cannot be accepted",
  );

  const bInvites = await listInvitesForTenant({
    companyId: b.company.id,
    role: "ADMIN",
  });
  assert(bInvites.length === 0, "tenant B does not see tenant A invites");

  const adminMembership = await prisma.membership.findFirstOrThrow({
    where: { userId: a.user.id, companyId: a.company.id },
  });

  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: a.user.id,
        actorRole: "ADMIN",
        membershipId: adminMembership.id,
        role: "SALES",
      }),
    "cannot change own role",
  );
  await expectThrow(
    () =>
      deactivateMemberForTenant({
        companyId: a.company.id,
        actorUserId: a.user.id,
        actorRole: "ADMIN",
        membershipId: adminMembership.id,
      }),
    "cannot deactivate self",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: manager.user.id,
        actorRole: "MANAGER",
        membershipId: secondAdmin.membership.id,
        role: "SALES",
      }),
    "manager cannot alter admin",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: manager.user.id,
        actorRole: "MANAGER",
        membershipId: sales.membership.id,
        role: "ADMIN",
      }),
    "manager cannot promote to admin",
  );
  await expectThrow(
    () =>
      deactivateMemberForTenant({
        companyId: a.company.id,
        actorUserId: manager.user.id,
        actorRole: "MANAGER",
        membershipId: secondAdmin.membership.id,
      }),
    "manager cannot deactivate admin",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: b.company.id,
        actorUserId: b.user.id,
        actorRole: "ADMIN",
        membershipId: sales.membership.id,
        role: "MANAGER",
      }),
    "tenant B cannot change tenant A role",
  );

  const salesVersionBefore = await getUserSessionVersion(sales.user.id);
  await changeMemberRoleForTenant({
    companyId: a.company.id,
    actorUserId: a.user.id,
    actorRole: "ADMIN",
    membershipId: sales.membership.id,
    role: "FINANCE",
  });
  const afterRole = await prisma.membership.findUniqueOrThrow({
    where: { id: sales.membership.id },
  });
  assert(afterRole.role === "FINANCE", "role changed");
  const salesVersionAfterRole = await getUserSessionVersion(sales.user.id);
  assert(
    (salesVersionAfterRole ?? 0) > (salesVersionBefore ?? 0),
    "role change invalidates session",
  );
  const afterRoleSheet = await getMemberForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    membershipId: sales.membership.id,
  });
  assert(afterRoleSheet?.permissions.includes("finance:manage"), "effective finance perms");
  assert(!afterRoleSheet?.permissions.includes("sales:create"), "lost sales create after role change");

  await deactivateMemberForTenant({
    companyId: a.company.id,
    actorUserId: a.user.id,
    actorRole: "ADMIN",
    membershipId: sales.membership.id,
  });
  assert(
    (await validateMembership({
      userId: sales.user.id,
      companyId: a.company.id,
    })) === null,
    "deactivated member cannot operate",
  );
  assert(
    (await getPrimaryMembership(sales.user.id)) === null,
    "deactivated member cannot login via membership",
  );
  const salesVersionAfterDeactivate = await getUserSessionVersion(sales.user.id);
  assert(
    (salesVersionAfterDeactivate ?? 0) > (salesVersionAfterRole ?? 0),
    "deactivate invalidates session",
  );

  const activityStillThere = await prisma.activity.count({
    where: { companyId: a.company.id, ownerId: sales.user.id, deletedAt: null },
  });
  assert(activityStillThere >= 2, "inactivation keeps assigned activities");
  const saleStillThere = await prisma.sale.findFirst({
    where: { companyId: a.company.id, sellerId: sales.user.id },
  });
  assert(saleStillThere, "inactivation keeps historical sales");
  const noteStillThere = await prisma.notification.count({
    where: { companyId: a.company.id, userId: sales.user.id, type: "TASK_ASSIGNED" },
  });
  assert(noteStillThere >= 1, "inactivation keeps notifications");

  const report = await getSalesReportForTenant({
    companyId: a.company.id,
    role: "ADMIN",
    query: {
      preset: "last_30",
      sellerId: sales.user.id,
      status: "COMPLETED",
      page: 1,
      pageSize: 20,
    },
  });
  assert(
    report.items.some((row) => row.sellerName.includes("Vendas A")),
    "sales report still names inactive seller",
  );
  assert(
    report.lookups.sellers.some((seller) => seller.id === sales.user.id),
    "report seller filter keeps inactive member",
  );
  const activeOwners = await listCompanyOwners(a.company.id);
  assert(
    activeOwners.every((owner) => owner.userId !== sales.user.id),
    "inactive member is not assignable as owner",
  );
  await expectThrow(
    () =>
      inviteMemberForTenant({
        companyId: a.company.id,
        userId: a.user.id,
        role: "ADMIN",
        email: sales.user.email,
        inviteRole: "SALES",
      }),
    "inactive member must be reactivated from member sheet",
  );

  await activateMemberForTenant({
    companyId: a.company.id,
    actorUserId: a.user.id,
    actorRole: "ADMIN",
    membershipId: sales.membership.id,
  });
  const restored = await prisma.membership.findUniqueOrThrow({
    where: { id: sales.membership.id },
  });
  assert(restored.deletedAt === null, "membership restored not duplicated");
  assert(restored.role === "FINANCE", "role preserved on reactivate");
  assert(
    (await validateMembership({
      userId: sales.user.id,
      companyId: a.company.id,
    })) != null,
    "reactivated member can operate",
  );
  const membershipCount = await prisma.membership.count({
    where: { userId: sales.user.id, companyId: a.company.id },
  });
  assert(membershipCount === 1, "unique membership preserved");

  await deactivateMemberForTenant({
    companyId: a.company.id,
    actorUserId: a.user.id,
    actorRole: "ADMIN",
    membershipId: secondAdmin.membership.id,
  });
  await expectThrow(
    () =>
      deactivateMemberForTenant({
        companyId: a.company.id,
        actorUserId: a.user.id,
        actorRole: "ADMIN",
        membershipId: adminMembership.id,
      }),
    "last remaining admin cannot deactivate self",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: a.user.id,
        actorRole: "ADMIN",
        membershipId: adminMembership.id,
        role: "MANAGER",
      }),
    "last remaining admin cannot demote self",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: a.company.id,
        actorUserId: manager.user.id,
        actorRole: "ADMIN",
        membershipId: adminMembership.id,
        role: "SALES",
      }),
    "last admin cannot be demoted even if role is spoofed",
  );

  const solo = await registerTenant({
    name: "Admin Solo",
    email: `team-solo-${suffix}@example.com`,
    companyName: `Empresa Solo ${suffix}`,
  });
  const soloMembership = await prisma.membership.findFirstOrThrow({
    where: { userId: solo.user.id, companyId: solo.company.id },
  });
  await expectThrow(
    () =>
      deactivateMemberForTenant({
        companyId: solo.company.id,
        actorUserId: solo.user.id,
        actorRole: "ADMIN",
        membershipId: soloMembership.id,
      }),
    "solo admin cannot deactivate self",
  );
  await expectThrow(
    () =>
      changeMemberRoleForTenant({
        companyId: solo.company.id,
        actorUserId: solo.user.id,
        actorRole: "ADMIN",
        membershipId: soloMembership.id,
        role: "SALES",
      }),
    "solo admin cannot remove own admin role",
  );

  await expectThrow(
    () =>
      resendInviteForTenant({
        companyId: b.company.id,
        userId: b.user.id,
        role: "ADMIN",
        inviteId: resendTarget.invite.id,
      }),
    "cannot resend other tenant invite",
  );

  const inviteAudits = await prisma.auditLog.findMany({
    where: {
      companyId: a.company.id,
      action: { in: ["INVITE_CREATE", "INVITE_RESEND"] },
    },
    select: { metadata: true },
  });
  const auditBlob = JSON.stringify(inviteAudits);
  assert(!auditBlob.includes(firstInvite.token), "raw invite token not stored in audit");
  assert(!auditBlob.includes(resent.token), "raw resent token not stored in audit");

  const leakedRoleAudits = await prisma.auditLog.count({
    where: { companyId: b.company.id, action: "MEMBER_ROLE_CHANGE" },
  });
  assert(leakedRoleAudits === 0, "tenant B has no leaked role-change audit");

  const audits = await prisma.auditLog.findMany({
    where: { companyId: a.company.id, module: "members" },
    select: { action: true },
  });
  const actions = new Set(audits.map((item) => item.action));
  assert(actions.has("INVITE_CREATE"), "audit invite create");
  assert(actions.has("INVITE_RESEND"), "audit invite resend");
  assert(actions.has("INVITE_REVOKE"), "audit invite revoke");
  assert(actions.has("INVITE_ACCEPT"), "audit invite accept");
  assert(actions.has("MEMBER_ROLE_CHANGE"), "audit role change");
  assert(actions.has("MEMBER_DEACTIVATE"), "audit deactivate");
  assert(actions.has("MEMBER_ACTIVATE"), "audit activate");

  console.log("TEAM VERIFY PASSED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
