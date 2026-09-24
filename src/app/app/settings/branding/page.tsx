import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { BrandingForm } from "@/modules/settings/components/branding-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { PageContainer, SectionCard } from "@/shared/components/page-layout";

export default async function SettingsBrandingPage() {
  const user = await requirePermission("settings:view");
  const profile = await getCompanyProfileForTenant({
    companyId: user.companyId,
    role: user.role,
  });
  const settings = profile.settings;
  const canManage = hasPermission(user.role, "settings:manage");

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="branding" />

      <div className="max-w-2xl">
        <SectionCard
          title="Marca da empresa"
          description="Logo e cores usadas em recibos, comprovantes e documentos operacionais."
        >
          <BrandingForm
            displayName={settings.displayName}
            primaryColor={settings.primaryColor}
            secondaryColor={settings.secondaryColor}
            hasLogo={Boolean(settings.logoPath)}
            canManage={canManage}
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
