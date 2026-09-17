import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
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
    <AuthScreen>
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={safeInternalPath(params.callbackUrl)} />
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
