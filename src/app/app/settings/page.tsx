import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { requirePermission } from "@/shared/auth/session";
import { listCompanyMembers } from "@/modules/auth/services/auth.service";
import { InviteMemberForm } from "@/modules/auth/components/invite-forms";
import { hasPermission } from "@/shared/permissions/rbac";

export default async function SettingsPage() {
  const user = await requirePermission("settings:view");
  const members = await listCompanyMembers(user.companyId);
  const canInvite = hasPermission(user.role, "settings:manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Empresa, membros e convites do tenant atual
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            Isolados por companyId da sessão ({user.companyId})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>
                  {member.user.name ?? member.user.email}{" "}
                  <span className="text-muted-foreground">
                    ({member.user.email})
                  </span>
                </span>
                <span className="font-medium">{member.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle>Convidar membro</CardTitle>
            <CardDescription>
              Requer permissão settings:manage (validado no server action)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
