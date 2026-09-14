import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { rolesAssignableBy } from "@/shared/permissions/rbac";
import {
  canManageTeam,
  getMemberForTenant,
} from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { MemberActions } from "@/modules/team/components/member-actions";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/modules/crm/lib/activity-labels";
import {
  AUDIT_ACTION_LABELS,
  MEMBER_STATUS_LABELS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  formatDateTimeBR,
} from "@/modules/team/lib/labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("team:view");
  const { id } = await params;
  const member = await getMemberForTenant({
    companyId: user.companyId,
    role: user.role,
    membershipId: id,
  });
  if (!member) {
    notFound();
  }

  const canManage =
    canManageTeam(user.role) &&
    member.userId !== user.id &&
    (member.role !== "ADMIN" || user.role === "ADMIN");
  const allowedRoles = rolesAssignableBy(user.role);

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="team" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {member.user.name ?? member.user.email}
          </h1>
          <p className="text-muted-foreground">{member.user.email}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/settings/team">Voltar à equipe</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
          <CardDescription>Dados do membro no tenant atual</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Empresa" value={member.company.name} />
          <DetailItem label="Função" value={ROLE_LABELS[member.role]} />
          <DetailItem
            label="Status"
            value={
              <Badge variant={member.active ? "secondary" : "outline"}>
                {member.active
                  ? MEMBER_STATUS_LABELS.active
                  : MEMBER_STATUS_LABELS.inactive}
              </Badge>
            }
          />
          <DetailItem
            label="Último acesso"
            value={formatDateTimeBR(member.lastAccessAt)}
          />
          <DetailItem
            label="Entrada na empresa"
            value={formatDateTimeBR(member.createdAt)}
          />
          <DetailItem
            label="Conta criada em"
            value={formatDateTimeBR(member.user.createdAt)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões herdadas</CardTitle>
          <CardDescription>
            Concedidas pelo papel {ROLE_LABELS[member.role]}. O RBAC atual é somente
            por função.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {member.permissions.map((permission) => (
              <li key={permission} className="rounded-md border px-3 py-2">
                <span className="font-medium">
                  {PERMISSION_LABELS[permission] ?? permission}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {permission}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividades atribuídas</CardTitle>
          <CardDescription>Últimas atividades em que este membro é responsável</CardDescription>
        </CardHeader>
        <CardContent>
          {member.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade atribuída.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {member.activities.map((activity) => (
                <li key={activity.id} className="rounded-md border px-3 py-2">
                  <Link
                    href={`/app/crm/activities/${activity.id}`}
                    className="font-medium text-emerald-700 underline"
                  >
                    {activity.title}
                  </Link>
                  <p className="text-muted-foreground">
                    {ACTIVITY_TYPE_LABELS[activity.type]} ·{" "}
                    {ACTIVITY_STATUS_LABELS[activity.status]}
                    {activity.dueAt ? ` · ${formatDateTimeBR(activity.dueAt)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico administrativo</CardTitle>
          <CardDescription>Auditoria de acessos e alterações deste membro</CardDescription>
        </CardHeader>
        <CardContent>
          {member.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos administrativos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {member.history.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 rounded-md border px-3 py-2">
                  <span>
                    {AUDIT_ACTION_LABELS[item.action] ?? item.action}
                    <span className="block text-xs text-muted-foreground">
                      {item.user?.name ?? item.user?.email ?? "Sistema"}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-muted-foreground">
                    {formatDateTimeBR(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Administração</CardTitle>
            <CardDescription>
              Alterações validadas no servidor. Não é possível remover o último
              administrador nem desativar a própria conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberActions
              membershipId={member.id}
              currentRole={member.role}
              active={member.active}
              allowedRoles={allowedRoles}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      ) : member.userId === user.id ? (
        <p className="text-sm text-muted-foreground">
          Você não pode alterar a própria função nem desativar a própria conta.
        </p>
      ) : null}
    </div>
  );
}
