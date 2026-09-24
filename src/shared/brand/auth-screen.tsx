import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";

const FEATURES = [
  "CRM e Pipeline de vendas",
  "Controle financeiro completo",
  "Estoque e compras integrados",
  "Relatórios e comunicações",
];

export function AuthScreen({
  children,
  variant = "login",
}: {
  children: React.ReactNode;
  variant?: "login" | "register";
}) {
  return (
    <main className="flex min-h-screen">
      <section className="relative hidden flex-col overflow-hidden bg-[var(--bos-navy)] p-12 lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bos-navy)] via-[#1a2d4e] to-[var(--bos-navy)]" />
        <div className="relative z-10 flex h-full flex-col">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size={32} className="size-8 brightness-0 invert" priority />
            <span className="text-lg font-semibold text-white">BusinessOS One</span>
          </Link>

          <div className="flex flex-1 flex-col justify-center">
            <h2 className="mb-4 text-3xl leading-tight font-extrabold text-white">
              {variant === "register" ? (
                <>Crie sua conta grátis</>
              ) : (
                <>
                  Gestão simples.
                  <br />
                  Resultados reais.
                </>
              )}
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-white/60">
              {variant === "register"
                ? "Comece a usar o BusinessOS ONE hoje. Plano gratuito completo, sem cartão de crédito."
                : "CRM, vendas, estoque, financeiro e muito mais em um sistema integrado para sua empresa crescer."}
            </p>
            <div className="mt-10 space-y-4">
              {(variant === "register"
                ? [
                    "Configuração em 5 minutos",
                    "Sem cartão de crédito",
                    "Cancele quando quiser",
                    "Dados protegidos com criptografia",
                  ]
                : FEATURES
              ).map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--bos-primary)]" />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/25">© {new Date().getFullYear()} BusinessOS ONE</p>
        </div>
      </section>

      <section className="flex flex-1 flex-col justify-center bg-white px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <BrandMark size={28} className="size-7" priority />
              <span className="font-semibold text-[var(--bos-navy)]">BusinessOS One</span>
            </Link>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export const authInputClass =
  "h-10 rounded-lg border-slate-200 text-sm focus-visible:border-[var(--bos-primary)] focus-visible:ring-[var(--bos-primary)]/20";

export const authLabelClass = "text-xs font-semibold text-slate-600";
