"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type ActionResult } from "@/modules/auth/actions/auth.actions";
import { authInputClass, authLabelClass } from "@/shared/brand/auth-screen";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl || "/app"} />
      <div>
        <Label htmlFor="email" className={authLabelClass}>
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com.br"
          className={`mt-1.5 ${authInputClass}`}
        />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="password" className={authLabelClass}>
            Senha
          </Label>
          <Link href="/forgot-password" className="text-xs text-[var(--bos-primary)] hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={`pr-10 ${authInputClass}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      {state?.error ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-[var(--bos-primary)] font-bold hover:bg-[var(--bos-primary-hover)]"
        disabled={pending}
      >
        {pending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/register" className="font-semibold text-[var(--bos-primary)] hover:underline">
          Começar gratuitamente
        </Link>
      </p>
    </form>
  );
}
