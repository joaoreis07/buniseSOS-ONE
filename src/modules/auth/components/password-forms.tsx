"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  resetPasswordAction,
  type ActionResult,
} from "@/modules/auth/actions/auth.actions";
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
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>
            {state.message}
            {state.token ? (
              <>
                {" "}
                <Link
                  href={`/reset-password?token=${state.token}`}
                  className="underline"
                >
                  Abrir redefinição
                </Link>
              </>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:underline">
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
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>
            {state.message}{" "}
            <Link href="/login" className="underline">
              Fazer login
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
