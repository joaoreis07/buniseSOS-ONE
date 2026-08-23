import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { requirePermission } from "@/shared/auth/session";
import { listPermissions } from "@/shared/permissions/rbac";

export default async function AppDashboardPage() {
  const user = await requirePermission("dashboard:view");
  const permissions = listPermissions(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Fundação pronta. Módulos de negócio virão nas próximas fases.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sessão</CardTitle>
            <CardDescription>Usuário autenticado e tenant ativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Usuário:</span>{" "}
              {user.name ?? user.email}
            </p>
            <p>
              <span className="text-muted-foreground">Empresa:</span>{" "}
              {user.companyId}
            </p>
            <p>
              <span className="text-muted-foreground">Papel:</span> {user.role}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
            <CardDescription>RBAC centralizado</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <li
                  key={permission}
                  className="rounded-md bg-muted px-2 py-1 text-xs"
                >
                  {permission}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
