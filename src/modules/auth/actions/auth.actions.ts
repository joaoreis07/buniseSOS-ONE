"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn, signOut } from "@/shared/auth/auth";
import {
  acceptInviteSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/modules/auth/schemas/auth.schemas";
import {
  acceptInvite,
  createPasswordResetToken,
  registerTenant,
  resetPasswordWithToken,
} from "@/modules/auth/services/auth.service";
import { requireSession } from "@/shared/auth/session";
import { writeAuditLog } from "@/shared/audit/audit";
import { publicErrorMessage } from "@/shared/errors/public-error";
import { safeInternalPath } from "@/shared/security/callback-url";
import { assertRateLimit, RateLimitError } from "@/shared/security/rate-limit";
import { clientRateKey } from "@/shared/security/request-key";

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

function isNextRedirect(error: unknown): boolean {
  return isRedirectError(error);
}

export async function loginAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const callbackUrl = safeInternalPath(formData.get("callbackUrl"));

  try {
    assertRateLimit({
      key: await clientRateKey("login", parsed.data.email),
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { ok: false, error: "E-mail ou senha inválidos" };
    }
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Não foi possível entrar" };
  }
}

export async function registerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    assertRateLimit({
      key: await clientRateKey("register", parsed.data.email),
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    await registerTenant(parsed.data);
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/app/onboarding",
    });
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha no cadastro"),
    };
  }
}

export async function logoutAction(): Promise<void> {
  const user = await requireSession().catch(() => null);
  if (user) {
    await writeAuditLog({
      companyId: user.companyId,
      userId: user.id,
      module: "auth",
      action: "LOGOUT",
      entity: "User",
      entityId: user.id,
    });
  }
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, error: "E-mail inválido" };
  }

  try {
    assertRateLimit({
      key: await clientRateKey("forgot", parsed.data.email),
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    await createPasswordResetToken(parsed.data.email);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: publicErrorMessage(error, "Não foi possível enviar as instruções"),
    };
  }

  return {
    ok: true,
    message: "Se o e-mail existir, enviaremos instruções de recuperação.",
  };
}

export async function resetPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    assertRateLimit({
      key: await clientRateKey("reset", parsed.data.token.slice(0, 8)),
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    await resetPasswordWithToken(parsed.data);
    return { ok: true, message: "Senha atualizada. Faça login." };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao redefinir senha"),
    };
  }
}

export async function acceptInviteAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    assertRateLimit({
      key: await clientRateKey("invite", parsed.data.token.slice(0, 8)),
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    const result = await acceptInvite(parsed.data);
    await signIn("credentials", {
      email: result.user.email,
      password: parsed.data.password,
      redirectTo: "/app",
    });
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: publicErrorMessage(error, "Falha ao aceitar convite"),
    };
  }
}
