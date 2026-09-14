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
  const url = process.env.DATABASE_URL ?? "";
  assert(url.includes("businessos_one"), "must use businessos_one");
  assert(!/localhost:5432\b/.test(url), "must not use Finance port");

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
