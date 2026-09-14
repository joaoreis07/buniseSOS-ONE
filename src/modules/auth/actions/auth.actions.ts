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

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  token?: string;
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

  const callbackUrl = String(formData.get("callbackUrl") || "/app");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/app",
    });
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { ok: false, error: "E-mail ou senha inválidos" };
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
    await registerTenant(parsed.data);
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/app",
    });
    return { ok: true };
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha no cadastro",
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

  const result = await createPasswordResetToken(parsed.data.email);
  // In development, surface token for local testing (no email provider yet)
  if (process.env.NODE_ENV === "development" && result.token) {
    console.info(`[auth] reset token for ${result.email}: ${result.token}`);
    return {
      ok: true,
      message: "Se o e-mail existir, enviaremos instruções. (token no console)",
      token: result.token,
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
    await resetPasswordWithToken(parsed.data);
    return { ok: true, message: "Senha atualizada. Faça login." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao redefinir senha",
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
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao aceitar convite",
    };
  }
}
