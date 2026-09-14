import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { rolesAssignableBy } from "@/shared/permissions/rbac";
import { teamListQuerySchema } from "@/modules/team/schemas/team.schemas";
import {
  canManageTeam,
  listInvitesForTenant,
  listTeamForTenant,
} from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { TeamFilters } from "@/modules/team/components/team-filters";
import { TeamTable } from "@/modules/team/components/team-table";
import { InviteMemberForm } from "@/modules/team/components/invite-member-form";
import { InvitesTable } from "@/modules/team/components/invites-table";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

function queryToParams(query: Record<string, unknown>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  params.set("page", String(page));
  return params.toString();
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("team:view");
  const raw = await searchParams;
  const parsed = teamListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : "20",
  });
  const query = parsed.success
    ? parsed.data
    : teamListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, invites] = await Promise.all([
    listTeamForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    listInvitesForTenant({
      companyId: user.companyId,
      role: user.role,
    }),
  ]);

  const canManage = canManageTeam(user.role);
  const allowedRoles = rolesAssignableBy(user.role);

  return (
    <div className="space-y-6">
      <SettingsSubnav role={user.role} active="team" />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-muted-foreground">
          Membros, convites e acessos do tenant · {result.total} registro
          {result.total === 1 ? "" : "s"}
        </p>
      </div>

      <TeamFilters query={query} />
      <TeamTable items={result.items} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/settings/team?${queryToParams(query, result.page - 1)}`}>
                Anterior
              </Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/settings/team?${queryToParams(query, result.page + 1)}`}>
                Próxima
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Convidar membro</CardTitle>
            <CardDescription>
              O token é armazenado em hash e vale por 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm allowedRoles={allowedRoles} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Convites</CardTitle>
          <CardDescription>Pendentes, aceitos, expirados e cancelados</CardDescription>
        </CardHeader>
        <CardContent>
          <InvitesTable items={invites} canManage={canManage} />
        </CardContent>
      </Card>
    </div>
  );
}
