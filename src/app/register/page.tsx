import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterForm } from "@/modules/auth/components/register-form";
import { AuthScreen } from "@/shared/brand/auth-screen";

export default function RegisterPage() {
  return (
    <AuthScreen variant="register">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={13} aria-hidden />
        Voltar ao início
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold text-[var(--bos-navy)]">Criar conta</h1>
      <p className="mb-8 text-sm text-slate-500">
        Cadastre sua empresa e comece como ADMIN no plano Free.
      </p>

      <RegisterForm />
    </AuthScreen>
  );
}
