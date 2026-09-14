"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/shared/auth/session";
import { inviteMemberSchema } from "@/modules/auth/schemas/auth.schemas";
import {
  changeMemberRoleSchema,
  inviteIdSchema,
  memberIdSchema,
} from "@/modules/team/schemas/team.schemas";
import {
  activateMemberForTenant,
  changeMemberRoleForTenant,
  deactivateMemberForTenant,
  inviteMemberForTenant,
  resendInviteForTenant,
  revokeInviteForTenant,
} from "@/modules/team/services/team.service";

export type TeamActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  token?: string;
};

function revalidateTeam(membershipId?: string) {
  revalidatePath("/app/settings");
  revalidatePath("/app/settings/team");
  revalidatePath("/app/settings/permissions");
  if (membershipId) {
    revalidatePath(`/app/settings/team/${membershipId}`);
  }
}

export async function inviteMemberAction(
  _prev: TeamActionResult | undefined,
  formData: FormData,
): Promise<TeamActionResult> {
  const user = await requirePermission("team:manage");
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const { token } = await inviteMemberForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      email: parsed.data.email,
      inviteRole: parsed.data.role,
    });
    if (process.env.NODE_ENV === "development") {
      console.info(`[team] invite token for ${parsed.data.email}: ${token}`);
    }
    revalidateTeam();
    return {
      ok: true,
      message: "Convite criado.",
      token: process.env.NODE_ENV === "development" ? token : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao convidar",
    };
  }
}

export async function resendInviteAction(
  _prev: TeamActionResult | undefined,
  formData: FormData,
): Promise<TeamActionResult> {
  const user = await requirePermission("team:manage");
  const parsed = inviteIdSchema.safeParse({ inviteId: formData.get("inviteId") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Convite inválido" };
  }

  try {
    const { token } = await resendInviteForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      inviteId: parsed.data.inviteId,
    });
    if (process.env.NODE_ENV === "development") {
      console.info(`[team] resent invite token: ${token}`);
    }
    revalidateTeam();
    return {
      ok: true,
      message: "Convite reenviado.",
      token: process.env.NODE_ENV === "development" ? token : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao reenviar convite",
    };
  }
}

export async function revokeInviteAction(
  _prev: TeamActionResult | undefined,
  formData: FormData,
): Promise<TeamActionResult> {
  const user = await requirePermission("team:manage");
  const parsed = inviteIdSchema.safeParse({ inviteId: formData.get("inviteId") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Convite inválido" };
  }

  try {
    await revokeInviteForTenant({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      inviteId: parsed.data.inviteId,
    });
    revalidateTeam();
    return { ok: true, message: "Convite cancelado." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao cancelar convite",
    };
  }
}

export async function changeMemberRoleAction(
  _prev: TeamActionResult | undefined,
  formData: FormData,
): Promise<TeamActionResult> {
  const user = await requirePermission("team:manage");
  const parsed = changeMemberRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await changeMemberRoleForTenant({
      companyId: user.companyId,
      actorUserId: user.id,
      actorRole: user.role,
      membershipId: parsed.data.membershipId,
      role: parsed.data.role,
    });
    revalidateTeam(parsed.data.membershipId);
    return { ok: true, message: "Função atualizada." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao alterar função",
    };
  }
}

export async function deactivateMemberAction(
  _prev: TeamActionResult | undefined,
  formData: FormData,
): Promise<TeamActionResult> {
  const user = await requirePermission("team:manage");
  const parsed = memberIdSchema.safeParse({
    membershipId: formData.get("membershipId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Membro inválido" };
  }

  try {
    await deactivateMemberForTenant({
      companyId: user.companyId,
      actorUserId: user.id,
      actorRole: user.role,
      membershipId: parsed.data.membershipId,
    });
    revalidateTeam(parsed.data.membershipId);
    return { ok: true, message: "Membro desativado." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao desativar membro",
    };
  }
}

export async function activateMemberAction(
  _prev: TeamActionResult | undefined,
  formData: FormData,
): Promise<TeamActionResult> {
  const user = await requirePermission("team:manage");
  const parsed = memberIdSchema.safeParse({
    membershipId: formData.get("membershipId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Membro inválido" };
  }

  try {
    await activateMemberForTenant({
      companyId: user.companyId,
      actorUserId: user.id,
      actorRole: user.role,
      membershipId: parsed.data.membershipId,
    });
    revalidateTeam(parsed.data.membershipId);
    return { ok: true, message: "Membro reativado." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao reativar membro",
    };
  }
}
