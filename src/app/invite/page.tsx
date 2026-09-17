import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { AcceptInviteForm } from "@/modules/auth/components/invite-forms";
import { AuthScreen } from "@/shared/brand/auth-screen";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { getInvitePreview } from "@/modules/auth/services/auth.service";
import { ROLE_LABELS } from "@/modules/team/lib/labels";

const STATUS_MESSAGES: Record<string, string> = {
  INVALID: "Este convite é inválido. Solicite um novo ao administrador.",
  EXPIRED: "Este convite expirou. Solicite um reenvio ao administrador.",
  ACCEPTED: "Este convite já foi utilizado.",
  REVOKED: "Este convite foi cancelado. Solicite um novo ao administrador.",
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const preview = token ? await getInvitePreview(token) : null;
  const canAccept = preview?.status === "PENDING";

  return (
    <AuthScreen>
      <Card>
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>
            {canAccept && preview.companyName
              ? `Entre em ${preview.companyName} no BusinessOS One`
              : "Entre na empresa que convidou você no BusinessOS One"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>
                Token de convite ausente.{" "}
                <Link href="/login" className="underline">
                  Ir para login
                </Link>
              </AlertDescription>
            </Alert>
          ) : canAccept ? (
            <>
              <p className="text-sm text-muted-foreground">
                Convite para {preview.email}
                {preview.role ? ` · ${ROLE_LABELS[preview.role]}` : ""}
              </p>
              <AcceptInviteForm token={token} />
            </>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                {STATUS_MESSAGES[preview?.status ?? "INVALID"]}{" "}
                <Link href="/login" className="underline">
                  Ir para login
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </AuthScreen>
  );
}
