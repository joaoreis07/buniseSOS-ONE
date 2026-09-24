"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  completeOnboardingAction,
  type OnboardingActionResult,
} from "@/modules/onboarding/actions/onboarding.actions";
import { authInputClass, authLabelClass } from "@/shared/brand/auth-screen";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const STEPS = ["Empresa", "Primeiros passos", "Pronto!"];

export function OnboardingForm({
  companyName,
  userName,
}: {
  companyName: string;
  userName: string;
}) {
  const [state, action, pending] = useActionState<OnboardingActionResult, FormData>(
    completeOnboardingAction,
    { ok: true },
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                index === 0
                  ? "bg-[var(--bos-primary)] text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:block ${
                index === 0 ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {step}
            </span>
            {index < STEPS.length - 1 ? (
              <div className="h-px w-6 bg-slate-200 sm:w-8" />
            ) : null}
          </div>
        ))}
      </div>

      <h1 className="text-xl font-extrabold text-[var(--bos-navy)]">
        Bem-vindo, {userName.split(" ")[0]}!
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Configure sua empresa em poucos passos. Você já está no plano Free — sem cartão de crédito.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="displayName" className={authLabelClass}>
            Nome da empresa
          </Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={companyName}
            required
            placeholder="Minha Empresa Ltda."
            className={`mt-1.5 ${authInputClass}`}
          />
        </div>
        <div>
          <Label htmlFor="document" className={authLabelClass}>
            CNPJ ou CPF (opcional)
          </Label>
          <Input
            id="document"
            name="document"
            placeholder="00.000.000/0001-00"
            className={`mt-1.5 ${authInputClass}`}
          />
        </div>
        <div>
          <Label htmlFor="phone" className={authLabelClass}>
            Telefone (opcional)
          </Label>
          <Input
            id="phone"
            name="phone"
            placeholder="(11) 99999-9999"
            className={`mt-1.5 ${authInputClass}`}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Primeiros passos
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {[
              "Cadastre seus primeiros clientes no CRM",
              "Adicione produtos ou serviços",
              "Registre uma venda de teste",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--bos-primary)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-10 w-full gap-2 rounded-lg bg-[var(--bos-primary)] font-bold hover:bg-[var(--bos-primary-hover)]"
          disabled={pending}
        >
          {pending ? "Salvando…" : "Entrar no sistema"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Precisa de ajuda?{" "}
        <Link href="/demo/dashboard" className="text-[var(--bos-primary)] hover:underline">
          Ver demonstração
        </Link>
      </p>
    </div>
  );
}
