import type { Role } from "@prisma/client";
import { PERMISSIONS, type Permission } from "@/shared/permissions/rbac";
import { PERMISSION_LABELS, ROLE_LABELS, permissionModule } from "@/modules/team/lib/labels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

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
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permissão</TableHead>
            {ROLES.map((role) => (
              <TableHead key={role} className="text-center">
                {ROLE_LABELS[role]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.flatMap(([moduleName, permissions]) => [
            <TableRow key={`module-${moduleName}`} className="bg-muted/40">
              <TableCell colSpan={ROLES.length + 1} className="font-medium">
                {moduleName}
              </TableCell>
            </TableRow>,
            ...permissions.map((permission) => (
              <TableRow key={permission}>
                <TableCell>
                  {PERMISSION_LABELS[permission] ?? permission}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {permission}
                  </span>
                </TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className="text-center">
                    {granted[role].has(permission) ? "✓" : "—"}
                  </TableCell>
                ))}
              </TableRow>
            )),
          ])}
        </TableBody>
      </Table>
    </div>
  );
}
