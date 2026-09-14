import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanySettingsOverview } from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { formatDateTimeBR } from "@/modules/team/lib/labels";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function SettingsCompanyPage() {
  const user = await requirePermission("settings:view");
  const overview = await getCompanySettingsOverview({
    companyId: user.companyId,
    role: user.role,
  });
  const canViewTeam = hasPermission(user.role, "team:view");

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="company" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Empresa</h1>
        <p className="text-muted-foreground">
          Dados do tenant atual e resumo de acessos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{overview.company?.name ?? "Empresa"}</CardTitle>
          <CardDescription>Isolado pelo companyId da sessão</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Identificador</p>
            <p className="font-mono text-xs">{overview.company?.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Criada em</p>
            <p>{formatDateTimeBR(overview.company?.createdAt ?? null)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Membros ativos</p>
            <p>{overview.activeMembers}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Convites pendentes</p>
            <p>{overview.pendingInvites}</p>
          </div>
        </CardContent>
      </Card>

      {canViewTeam ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/app/settings/team">Administrar equipe</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/settings/permissions">Ver permissões</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
