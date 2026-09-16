import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";
import { safeInternalPath } from "@/shared/security/callback-url";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>BusinessOS One</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={safeInternalPath(params.callbackUrl)} />
        </CardContent>
      </Card>
    </main>
  );
}
