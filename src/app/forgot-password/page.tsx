import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/modules/auth/components/password-forms";
import { AuthScreen } from "@/shared/brand/auth-screen";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen variant="login">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={13} aria-hidden />
        Voltar ao login
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold text-[var(--bos-navy)]">Recuperar senha</h1>
      <p className="mb-8 text-sm text-slate-500">
        Informe o e-mail da sua conta BusinessOS One
      </p>

      <ForgotPasswordForm />
    </AuthScreen>
  );
}
