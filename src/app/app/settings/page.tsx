import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { CompanyProfileForm } from "@/modules/settings/components/company-profile-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { formatDateTimeBR } from "@/modules/team/lib/labels";
import { getCompanySettingsOverview } from "@/modules/team/services/team.service";
import Link from "next/link";
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
  const [overview, profile] = await Promise.all([
    getCompanySettingsOverview({
      companyId: user.companyId,
      role: user.role,
    }),
    getCompanyProfileForTenant({
      companyId: user.companyId,
      role: user.role,
    }),
  ]);
  const canManage = hasPermission(user.role, "settings:manage");
  const canViewTeam = hasPermission(user.role, "team:view");
  const company = profile.company;
  if (!company) {
    return <p>Empresa não encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="company" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Empresa</h1>
        <p className="text-muted-foreground">
          Dados do tenant atuais. Isolado pelo companyId da sessão.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{company.name}</CardTitle>
          <CardDescription>
            Criada em {formatDateTimeBR(company.createdAt)} · {overview.activeMembers}{" "}
            membros · {overview.pendingInvites} convites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 font-mono text-xs text-muted-foreground">{company.id}</p>
          <CompanyProfileForm company={company} canManage={canManage} />
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
