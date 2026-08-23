import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { AcceptInviteForm } from "@/modules/auth/components/invite-forms";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import Link from "next/link";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>
            Entre na empresa que convidou você no BusinessOS One
          </CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <AcceptInviteForm token={token} />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Token de convite ausente.{" "}
                <Link href="/login" className="underline">
                  Ir para login
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
