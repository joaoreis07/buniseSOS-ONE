import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { ResetPasswordForm } from "@/modules/auth/components/password-forms";
import { AuthScreen } from "@/shared/brand/auth-screen";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <AuthScreen>
      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Token ausente.{" "}
                <Link href="/forgot-password" className="underline">
                  Solicitar novamente
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
