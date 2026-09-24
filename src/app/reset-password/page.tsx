import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResetPasswordForm } from "@/modules/auth/components/password-forms";
import { AuthScreen } from "@/shared/brand/auth-screen";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <AuthScreen variant="login">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft size={13} aria-hidden />
        Voltar ao login
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold text-[var(--bos-navy)]">Nova senha</h1>
      <p className="mb-8 text-sm text-slate-500">Defina uma nova senha para sua conta</p>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>
            Token ausente.{" "}
            <Link href="/forgot-password" className="underline">
              Solicitar novamente
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </AuthScreen>
  );
}
