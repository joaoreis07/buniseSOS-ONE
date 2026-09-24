import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { CompanyProfileForm } from "@/modules/settings/components/company-profile-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { formatDateTimeBR } from "@/modules/team/lib/labels";
import { getCompanySettingsOverview } from "@/modules/team/services/team.service";
import { Button } from "@/shared/ui/button";
import { PageContainer, SectionCard } from "@/shared/components/page-layout";

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
    <PageContainer>
      <SettingsSubnav role={user.role} active="company" />

      <div className="max-w-2xl space-y-6">
        <SectionCard
          title="Informações da empresa"
          description={`Criada em ${formatDateTimeBR(company.createdAt)} · ${overview.activeMembers} membros · ${overview.pendingInvites} convites`}
        >
          <p className="mb-4 font-mono text-xs text-slate-400">{company.id}</p>
          <CompanyProfileForm company={company} canManage={canManage} />
        </SectionCard>

        {canViewTeam ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl">
              <Link href="/app/settings/team">Administrar equipe</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/app/settings/permissions">Ver permissões</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
