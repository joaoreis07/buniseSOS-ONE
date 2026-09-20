import { requirePermission } from "@/shared/auth/session";
import { getAccessMatrixForRole } from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { PermissionsMatrix } from "@/modules/team/components/permissions-matrix";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

export default async function PermissionsPage() {
  const user = await requirePermission("team:view");
  const matrix = getAccessMatrixForRole(user.role);

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="permissions" />

      <PageHeader
        eyebrow="Configurações"
        title="Permissões"
        description="Matriz de acesso por papel aplicada a toda a organização."
      />

      <PermissionsMatrix matrix={matrix} />
    </PageContainer>
  );
}
