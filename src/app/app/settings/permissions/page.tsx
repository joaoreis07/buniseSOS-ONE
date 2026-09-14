import { requirePermission } from "@/shared/auth/session";
import { getAccessMatrixForRole } from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { PermissionsMatrix } from "@/modules/team/components/permissions-matrix";

export default async function PermissionsPage() {
  const user = await requirePermission("team:view");
  const matrix = getAccessMatrixForRole(user.role);

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="permissions" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissões</h1>
        <p className="text-muted-foreground">
          Matriz real do RBAC por papel. Não há overrides individuais nesta fase.
        </p>
      </div>

      <PermissionsMatrix matrix={matrix} />
    </div>
  );
}
