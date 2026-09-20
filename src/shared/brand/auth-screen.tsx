import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";

export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.72fr)]">
      <section className="relative hidden overflow-hidden bg-[#071225] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.32),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,.14),transparent_30%)]" />
        <Link href="/" className="relative flex items-center gap-3">
          <BrandMark size={44} className="size-11 ring-1 ring-white/20" priority />
          <span>
            <span className="block text-lg font-semibold">BusinessOS One</span>
            <span className="block text-xs uppercase tracking-[0.16em] text-blue-300">
              Gestão integrada
            </span>
          </span>
        </Link>
        <div className="relative max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
            Sua operação em um só lugar
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em]">
            Clareza para decidir. Controle para crescer.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            CRM, vendas, estoque, compras e financeiro conectados à rotina da sua empresa.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-slate-200">
            {["Visão completa da operação", "Permissões por perfil", "Dados isolados por empresa"].map(
              (item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-blue-400" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          BusinessOS One · Gestão simples. Resultados reais.
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <BrandMark size={40} className="size-10" priority />
            <span className="font-semibold text-slate-950">BusinessOS One</span>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
