import type { Role } from "@prisma/client";
import {
  assertPermission,
  getRolePermissionMatrix,
  hasPermission,
  listPermissions,
  rolesAssignableBy,
} from "@/shared/permissions/rbac";
import { writeAuditLog } from "@/shared/audit/audit";
import {
  bumpUserSessionVersion,
  createInvite,
  createToken,
  hashToken,
} from "@/modules/auth/services/auth.service";
import type { TeamListQuery } from "@/modules/team/schemas/team.schemas";
import {
  countActiveAdmins,
  findInviteById,
  findInvites,
  findLastLogins,
  findMemberActivities,
  findMemberAudit,
  findMembershipById,
  findMembers,
  getCompanyOverview,
  setMembershipDeletedAt,
  updateMembershipRole,
} from "@/modules/team/repositories/team.repository";
import { prisma } from "@/shared/db/prisma";

export function canViewTeam(role: Role) {
  return hasPermission(role, "team:view");
}

export function canManageTeam(role: Role) {
  return hasPermission(role, "team:manage");
}

function assertAssignableRole(actorRole: Role, targetRole: Role) {
  if (!rolesAssignableBy(actorRole).includes(targetRole)) {
    throw new Error("Você não pode atribuir esta função");
  }
}

async function assertNotLastAdmin(params: {
  companyId: string;
  currentRole: Role;
}) {
  if (params.currentRole !== "ADMIN") return;
  const admins = await countActiveAdmins(params.companyId);
  if (admins <= 1) {
    throw new Error("A empresa precisa manter pelo menos um administrador ativo");
  }
}

export function getAccessMatrixForRole(role: Role) {
  assertPermission(role, "team:view");
  return getRolePermissionMatrix();
}

export async function getCompanySettingsOverview(params: {
  companyId: string;
  role: Role;
}) {
  assertPermission(params.role, "settings:view");
  return getCompanyOverview(params.companyId);
}

export async function listTeamForTenant(params: {
  companyId: string;
  role: Role;
  query: TeamListQuery;
}) {
  assertPermission(params.role, "team:view");
  const result = await findMembers({ companyId: params.companyId, ...params.query });
  const lastLogins = await findLastLogins({
    companyId: params.companyId,
    userIds: result.items.map((item) => item.user.id),
  });
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      lastAccessAt: lastLogins.get(item.user.id) ?? null,
      active: item.deletedAt == null,
    })),
  };
}

export async function getMemberForTenant(params: {
  companyId: string;
  role: Role;
  membershipId: string;
}) {
  assertPermission(params.role, "team:view");
  const member = await findMembershipById(params);
  if (!member) return null;
  const [lastLogins, activities, history] = await Promise.all([
    findLastLogins({ companyId: params.companyId, userIds: [member.user.id] }),
    findMemberActivities({ companyId: params.companyId, userId: member.user.id }),
    findMemberAudit({
      companyId: params.companyId,
      userId: member.user.id,
      membershipId: member.id,
    }),
  ]);
  return {
    ...member,
    lastAccessAt: lastLogins.get(member.user.id) ?? null,
    active: member.deletedAt == null,
    permissions: listPermissions(member.role),
    activities,
    history,
  };
}

export async function listInvitesForTenant(params: {
  companyId: string;
  role: Role;
}) {
  assertPermission(params.role, "team:view");
  return findInvites({ companyId: params.companyId });
}

export async function inviteMemberForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  email: string;
  inviteRole: Role;
}) {
  assertPermission(params.role, "team:manage");
  assertAssignableRole(params.role, params.inviteRole);
  return createInvite({
    companyId: params.companyId,
    invitedById: params.userId,
    email: params.email,
    role: params.inviteRole,
  });
}

export async function resendInviteForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  inviteId: string;
}) {
  assertPermission(params.role, "team:manage");
  const invite = await findInviteById(params);
  if (!invite) throw new Error("Convite não encontrado");
  if (invite.status === "ACCEPTED") {
    throw new Error("Este convite já foi aceito");
  }
  assertAssignableRole(params.role, invite.role);

  await prisma.invite.updateMany({
    where: {
      companyId: params.companyId,
      email: invite.email,
      status: "PENDING",
      NOT: { id: invite.id },
    },
    data: { status: "REVOKED" },
  });

  const token = createToken();
  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: {
      token: hashToken(token),
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: null,
    },
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "members",
    action: "INVITE_RESEND",
    entity: "Invite",
    entityId: updated.id,
    metadata: { email: updated.email, role: updated.role },
  });

  return { invite: updated, token };
}

export async function revokeInviteForTenant(params: {
  companyId: string;
  userId: string;
  role: Role;
  inviteId: string;
}) {
  assertPermission(params.role, "team:manage");
  const invite = await findInviteById(params);
  if (!invite) throw new Error("Convite não encontrado");
  if (invite.status !== "PENDING") {
    throw new Error("Somente convites pendentes podem ser cancelados");
  }
  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: { status: "REVOKED" },
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    module: "members",
    action: "INVITE_REVOKE",
    entity: "Invite",
    entityId: updated.id,
    metadata: { email: updated.email },
  });
  return updated;
}

export async function changeMemberRoleForTenant(params: {
  companyId: string;
  actorUserId: string;
  actorRole: Role;
  membershipId: string;
  role: Role;
}) {
  assertPermission(params.actorRole, "team:manage");
  const member = await findMembershipById({
    companyId: params.companyId,
    membershipId: params.membershipId,
  });
  if (!member || member.deletedAt) throw new Error("Membro não encontrado");
  if (member.userId === params.actorUserId) {
    throw new Error("Você não pode alterar a própria função");
  }
  if (member.role === "ADMIN" && params.actorRole !== "ADMIN") {
    throw new Error("Somente um administrador pode alterar outro administrador");
  }
  assertAssignableRole(params.actorRole, params.role);
  if (member.role === "ADMIN" && params.role !== "ADMIN") {
    await assertNotLastAdmin({
      companyId: params.companyId,
      currentRole: member.role,
    });
  }

  const updated = await updateMembershipRole({
    membershipId: member.id,
    role: params.role,
  });
  await bumpUserSessionVersion(member.userId);
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.actorUserId,
    module: "members",
    action: "MEMBER_ROLE_CHANGE",
    entity: "Membership",
    entityId: member.id,
    metadata: { from: member.role, to: params.role, userId: member.userId },
  });
  return updated;
}

export async function deactivateMemberForTenant(params: {
  companyId: string;
  actorUserId: string;
  actorRole: Role;
  membershipId: string;
}) {
  assertPermission(params.actorRole, "team:manage");
  const member = await findMembershipById({
    companyId: params.companyId,
    membershipId: params.membershipId,
  });
  if (!member) throw new Error("Membro não encontrado");
  if (member.userId === params.actorUserId) {
    throw new Error("Você não pode desativar a própria conta");
  }
  if (member.deletedAt) throw new Error("Membro já está inativo");
  if (member.role === "ADMIN" && params.actorRole !== "ADMIN") {
    throw new Error("Somente um administrador pode desativar outro administrador");
  }
  await assertNotLastAdmin({
    companyId: params.companyId,
    currentRole: member.role,
  });

  const updated = await setMembershipDeletedAt({
    membershipId: member.id,
    deletedAt: new Date(),
  });
  await bumpUserSessionVersion(member.userId);
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.actorUserId,
    module: "members",
    action: "MEMBER_DEACTIVATE",
    entity: "Membership",
    entityId: member.id,
    metadata: { userId: member.userId, role: member.role },
  });
  return updated;
}

export async function activateMemberForTenant(params: {
  companyId: string;
  actorUserId: string;
  actorRole: Role;
  membershipId: string;
}) {
  assertPermission(params.actorRole, "team:manage");
  const member = await findMembershipById({
    companyId: params.companyId,
    membershipId: params.membershipId,
  });
  if (!member) throw new Error("Membro não encontrado");
  if (!member.deletedAt) throw new Error("Membro já está ativo");
  if (member.role === "ADMIN") {
    assertAssignableRole(params.actorRole, "ADMIN");
  }

  const updated = await setMembershipDeletedAt({
    membershipId: member.id,
    deletedAt: null,
  });
  await writeAuditLog({
    companyId: params.companyId,
    userId: params.actorUserId,
    module: "members",
    action: "MEMBER_ACTIVATE",
    entity: "Membership",
    entityId: member.id,
    metadata: { userId: member.userId, role: member.role },
  });
  return updated;
}
