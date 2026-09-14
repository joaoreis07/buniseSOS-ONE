import { requirePermission } from "@/shared/auth/session";
import { getCompanySettingsOverview } from "@/modules/team/services/team.service";
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
  const overview = await getCompanySettingsOverview({
    companyId: user.companyId,
    role: user.role,
  });
  const settings = overview.settings;

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="preferences" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preferências</h1>
        <p className="text-muted-foreground">
          Preferências da empresa já persistidas no tenant
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Localidade</CardTitle>
          <CardDescription>
            Valores padrão da empresa. Edição avançada fica para uma fase posterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Idioma</p>
            <p>{settings?.language ?? "pt-BR"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Moeda</p>
            <p>{settings?.currency ?? "BRL"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fuso horário</p>
            <p>{settings?.timezone ?? "America/Sao_Paulo"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Formato de data</p>
            <p>{settings?.dateFormat ?? "dd/MM/yyyy"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tema</p>
            <p>{settings?.theme ?? "light"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
