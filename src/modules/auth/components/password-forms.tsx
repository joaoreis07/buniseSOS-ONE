"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  resetPasswordAction,
  type ActionResult,
} from "@/modules/auth/actions/auth.actions";
import { authInputClass, authLabelClass } from "@/shared/brand/auth-screen";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    forgotPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email" className={authLabelClass}>
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="seu@email.com.br"
          className={`mt-1.5 ${authInputClass}`}
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert className="rounded-xl">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-[var(--bos-primary)] font-bold hover:bg-[var(--bos-primary-hover)]"
        disabled={pending}
      >
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-slate-500 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password" className={authLabelClass}>
          Nova senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className={`mt-1.5 ${authInputClass}`}
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert className="rounded-xl">
          <AlertDescription>
            {state.message}{" "}
            <Link href="/login" className="underline">
              Fazer login
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-[var(--bos-primary)] font-bold hover:bg-[var(--bos-primary-hover)]"
        disabled={pending}
      >
        {pending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
