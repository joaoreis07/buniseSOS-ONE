import type { Role } from "@prisma/client";
import { CheckCircle2, XCircle } from "lucide-react";
import { PERMISSIONS, type Permission } from "@/shared/permissions/rbac";
import { PERMISSION_LABELS, ROLE_LABELS, permissionModule } from "@/modules/team/lib/labels";

const ROLES: Role[] = ["ADMIN", "MANAGER", "SALES", "FINANCE", "INVENTORY"];

function groupPermissions() {
  const groups = new Map<string, Permission[]>();
  for (const permission of PERMISSIONS) {
    const moduleName = permissionModule(permission);
    const list = groups.get(moduleName) ?? [];
    list.push(permission);
    groups.set(moduleName, list);
  }
  return [...groups.entries()];
}

function Check({ val }: { val: boolean }) {
  return val ? (
    <CheckCircle2 size={16} className="text-emerald-500" aria-label="Permitido" />
  ) : (
    <XCircle size={16} className="text-slate-200" aria-label="Negado" />
  );
}

export function PermissionsMatrix({
  matrix,
}: {
  matrix: Record<Role, Permission[]>;
}) {
  const groups = groupPermissions();
  const granted = Object.fromEntries(
    ROLES.map((role) => [role, new Set(matrix[role])]),
  ) as Record<Role, Set<Permission>>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="grid grid-cols-[1fr_repeat(5,minmax(0,5rem))] gap-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Permissão
          </div>
          {ROLES.map((role) => (
            <div key={role} className="text-center text-xs font-bold text-slate-600">
              {ROLE_LABELS[role]}
            </div>
          ))}
        </div>
      </div>

      {groups.map(([moduleName, permissions]) => (
        <div key={moduleName}>
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              {moduleName}
            </span>
          </div>
          {permissions.map((permission) => (
            <div
              key={permission}
              className="grid grid-cols-[1fr_repeat(5,minmax(0,5rem))] gap-4 border-b border-slate-50 px-5 py-3 hover:bg-slate-50/50"
            >
              <div className="min-w-0 text-sm text-slate-600">
                {PERMISSION_LABELS[permission] ?? permission}
              </div>
              {ROLES.map((role) => (
                <div key={role} className="flex justify-center">
                  <Check val={granted[role].has(permission)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
