import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { PreferencesForm } from "@/modules/settings/components/preferences-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { PageContainer, SectionCard } from "@/shared/components/page-layout";

export default async function SettingsPreferencesPage() {
  const user = await requirePermission("settings:view");
  const profile = await getCompanyProfileForTenant({
    companyId: user.companyId,
    role: user.role,
  });
  const settings = profile.settings;
  const canManage = hasPermission(user.role, "settings:manage");

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="preferences" />

      <div className="max-w-2xl">
        <SectionCard
          title="Configurações gerais"
          description="Localidade, moeda, datas e aparência da experiência."
        >
          <PreferencesForm
            language={settings.language}
            currency={settings.currency}
            timezone={settings.timezone}
            dateFormat={settings.dateFormat}
            theme={settings.theme}
            canManage={canManage}
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
