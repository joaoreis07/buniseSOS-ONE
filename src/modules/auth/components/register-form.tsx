"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionResult } from "@/modules/auth/actions/auth.actions";
import { authInputClass, authLabelClass } from "@/shared/brand/auth-screen";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    registerAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name" className={authLabelClass}>
          Seu nome
        </Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="João Silva"
          className={`mt-1.5 ${authInputClass}`}
        />
      </div>
      <div>
        <Label htmlFor="companyName" className={authLabelClass}>
          Nome da empresa
        </Label>
        <Input
          id="companyName"
          name="companyName"
          required
          placeholder="Empresa Exemplo Ltda."
          className={`mt-1.5 ${authInputClass}`}
        />
      </div>
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
        <Label htmlFor="password" className={authLabelClass}>
          Senha
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
      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-[var(--bos-primary)] font-bold hover:bg-[var(--bos-primary-hover)]"
        disabled={pending}
      >
        {pending ? "Criando..." : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-[var(--bos-primary)] hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
