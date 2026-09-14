import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { PreferencesForm } from "@/modules/settings/components/preferences-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function SettingsPreferencesPage() {
  const user = await requirePermission("settings:view");
  const profile = await getCompanyProfileForTenant({
    companyId: user.companyId,
    role: user.role,
  });
  const settings = profile.settings;
  const canManage = hasPermission(user.role, "settings:manage");

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="preferences" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preferências</h1>
        <p className="text-muted-foreground">
          Localidade e formato já persistidos neste tenant.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Localidade</CardTitle>
          <CardDescription>
            Valores realmente usados pelo One hoje. Sem construtor de temas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            language={settings.language}
            currency={settings.currency}
            timezone={settings.timezone}
            dateFormat={settings.dateFormat}
            theme={settings.theme}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
