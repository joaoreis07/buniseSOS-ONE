import { requirePermission } from "@/shared/auth/session";
import { getAccessMatrixForRole } from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { PermissionsMatrix } from "@/modules/team/components/permissions-matrix";
import { PageContainer } from "@/shared/components/page-layout";

export default async function PermissionsPage() {
  const user = await requirePermission("team:view");
  const matrix = getAccessMatrixForRole(user.role);

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="permissions" />

      <div className="max-w-4xl">
        <PermissionsMatrix matrix={matrix} />
        <p className="mt-3 text-xs text-slate-400">
          As permissões são fixas por nível de acesso. Personalize atribuindo o nível correto a cada
          membro da equipe.
        </p>
      </div>
    </PageContainer>
  );
}
