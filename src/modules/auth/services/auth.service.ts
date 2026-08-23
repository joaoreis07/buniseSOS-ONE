import { createHash, randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { notDeletedFilter } from "@/shared/tenant/tenant";
import { writeAuditLog } from "@/shared/audit/audit";
import type { RegisterInput } from "@/modules/auth/schemas/auth.schemas";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export function createToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getPrimaryMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId, ...notDeletedFilter },
    orderBy: { createdAt: "asc" },
    select: { id: true, companyId: true, role: true },
  });
}

export async function validateMembership(params: {
  userId: string;
  companyId: string;
}) {
  return prisma.membership.findFirst({
    where: {
      userId: params.userId,
      companyId: params.companyId,
      ...notDeletedFilter,
      company: { deletedAt: null },
      user: { deletedAt: null },
    },
    select: { id: true, companyId: true, role: true },
  });
}

export async function getUserSessionVersion(
  userId: string,
): Promise<number | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { sessionVersion: true },
  });
  return user?.sessionVersion ?? null;
}

export async function bumpUserSessionVersion(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function registerTenant(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Já existe uma conta com este e-mail");
  }

  const passwordHash = await hashPassword(input.password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
      },
    });

    const company = await tx.company.create({
      data: { name: input.companyName.trim() },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: "ADMIN",
      },
    });

    await tx.companySettings.create({
      data: { companyId: company.id },
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        module: "auth",
        action: "REGISTER",
        entity: "Company",
        entityId: company.id,
        metadata: { email },
      },
    });

    return { user, company };
  });

  return result;
}

export async function createPasswordResetToken(email: string) {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
    select: { id: true, email: true },
  });

  // Always succeed outwardly (no enumeration)
  if (!user) {
    return { token: null as string | null, email: normalized };
  }

  const token = createToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${normalized}` },
  });
  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${normalized}`,
      token: hashToken(token),
      expires,
    },
  });

  return { token, email: normalized };
}

export async function resetPasswordWithToken(params: {
  token: string;
  password: string;
}) {
  const hashed = hashToken(params.token);
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashed },
  });
  if (!record || record.expires < new Date()) {
    throw new Error("Token inválido ou expirado");
  }
  if (!record.identifier.startsWith("reset:")) {
    throw new Error("Token inválido");
  }

  const email = record.identifier.slice("reset:".length);
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const passwordHash = await hashPassword(params.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);

  await writeAuditLog({
    userId: user.id,
    module: "auth",
    action: "RESET_PASSWORD",
    entity: "User",
    entityId: user.id,
  });
}

export async function createInvite(params: {
  companyId: string;
  invitedById: string;
  email: string;
  role: Role;
}) {
  const email = params.email.toLowerCase().trim();
  const existingMembership = await prisma.membership.findFirst({
    where: {
      companyId: params.companyId,
      ...notDeletedFilter,
      user: { email, deletedAt: null },
    },
    select: { id: true },
  });
  if (existingMembership) {
    throw new Error("Este usuário já é membro da empresa");
  }

  const token = createToken();
  const invite = await prisma.invite.create({
    data: {
      companyId: params.companyId,
      email,
      role: params.role,
      token: hashToken(token),
      invitedById: params.invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "PENDING",
    },
  });

  await writeAuditLog({
    companyId: params.companyId,
    userId: params.invitedById,
    module: "members",
    action: "INVITE_CREATE",
    entity: "Invite",
    entityId: invite.id,
    metadata: { email, role: params.role },
  });

  return { invite, token };
}

export async function acceptInvite(params: {
  token: string;
  name: string;
  password: string;
}) {
  const hashed = hashToken(params.token);
  const invite = await prisma.invite.findFirst({
    where: { token: hashed, status: "PENDING" },
  });
  if (!invite || invite.expiresAt < new Date()) {
    throw new Error("Convite inválido ou expirado");
  }

  const email = invite.email.toLowerCase();
  const passwordHash = await hashPassword(params.password);

  const result = await prisma.$transaction(async (tx) => {
    let user = await tx.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          name: params.name.trim(),
          email,
          passwordHash,
          emailVerified: new Date(),
        },
      });
    } else if (!user.passwordHash) {
      user = await tx.user.update({
        where: { id: user.id },
        data: {
          name: params.name.trim(),
          passwordHash,
        },
      });
    }

    const existing = await tx.membership.findFirst({
      where: {
        userId: user.id,
        companyId: invite.companyId,
        ...notDeletedFilter,
      },
    });
    if (!existing) {
      await tx.membership.create({
        data: {
          userId: user.id,
          companyId: invite.companyId,
          role: invite.role,
        },
      });
    }

    await tx.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    return { user, companyId: invite.companyId, role: invite.role };
  });

  await writeAuditLog({
    companyId: result.companyId,
    userId: result.user.id,
    module: "members",
    action: "INVITE_ACCEPT",
    entity: "Membership",
    metadata: { email, role: result.role },
  });

  return result;
}

export async function listCompanyMembers(companyId: string) {
  return prisma.membership.findMany({
    where: { companyId, ...notDeletedFilter },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
