import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/modules/auth/components/login-form";
import { AuthScreen } from "@/shared/brand/auth-screen";
import { safeInternalPath } from "@/shared/security/callback-url";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthScreen variant="login">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={13} aria-hidden />
        Voltar ao início
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold text-[var(--bos-navy)]">Entrar na sua conta</h1>
      <p className="mb-8 text-sm text-slate-500">Bem-vindo de volta ao BusinessOS ONE.</p>

      <LoginForm callbackUrl={safeInternalPath(params.callbackUrl)} />

      <div className="mt-6 border-t border-slate-100 pt-6 text-center">
        <Link
          href="/demo/dashboard"
          className="text-xs text-slate-400 transition-colors hover:text-slate-600"
        >
          Ver demonstração sem cadastro →
        </Link>
      </div>
    </AuthScreen>
  );
}
