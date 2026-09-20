import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { BrandingForm } from "@/modules/settings/components/branding-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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

      <PageHeader
        eyebrow="Configurações"
        title="Identidade visual"
        description="Logo e cores usadas em recibos, comprovantes e documentos operacionais."
      />

      <Card>
        <CardHeader>
          <CardTitle>Marca da empresa</CardTitle>
          <CardDescription>
            A logo fica isolada por tenant e só é servida para a sessão autenticada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm
            displayName={settings.displayName}
            primaryColor={settings.primaryColor}
            secondaryColor={settings.secondaryColor}
            hasLogo={Boolean(settings.logoPath)}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
